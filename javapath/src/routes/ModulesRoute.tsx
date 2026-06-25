import { Bookmark, ChevronDown, Search, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { RouteProps } from '../App';
import { Panel, ProgressBar, StatusSelect, Tag } from '../components/Primitives';
import { SafeHtml } from '../components/SafeHtml';
import { appData, chapterLookup, moduleLookup } from '../data/appData';
import { getProgress, masteryForModule } from '../lib/metrics';
import { toggleFavorite, updateNote, upsertProgress } from '../lib/storage';

export function ModulesRoute({ state, setState, globalQuery, goTo }: RouteProps) {
  const [selectedModule, setSelectedModule] = useState(appData.modules[0]?.id ?? 'collections');
  const [selectedPoint, setSelectedPoint] = useState('');
  const [tagFilter, setTagFilter] = useState('全部');
  const [query, setQuery] = useState(globalQuery);

  const module = moduleLookup.get(selectedModule) ?? appData.modules[0];
  const modulePoints = useMemo(
    () => appData.knowledgePoints.filter((point) => point.moduleId === module.id),
    [module.id]
  );

  useEffect(() => {
    const q = globalQuery.trim();
    if (!q) return;

    const hit = appData.knowledgePoints.find((point) =>
      `${point.title} ${point.tags.join(' ')} ${point.coreConcepts.map((item) => item.title + item.body).join(' ')}`
        .toLowerCase()
        .includes(q.toLowerCase())
    );

    if (hit) {
      setSelectedModule(hit.moduleId);
      setSelectedPoint(hit.id);
      setTagFilter('全部');
      setQuery('');
      return;
    }

    setSelectedPoint('');
    setTagFilter('全部');
    setQuery(q);
  }, [globalQuery]);

  const points = useMemo(() => {
    return modulePoints.filter((point) => {
      const tagOk = tagFilter === '全部' || point.tags.includes(tagFilter);
      const q = query.trim().toLowerCase();
      const searchOk =
        !q ||
        `${point.title} ${point.tags.join(' ')} ${point.coreConcepts.map((item) => item.title + item.body).join(' ')}`
          .toLowerCase()
          .includes(q);
      return tagOk && searchOk;
    });
  }, [modulePoints, tagFilter, query]);

  const activePoint = appData.knowledgePoints.find((point) => point.id === selectedPoint) ?? points[0];
  const activeIndex = activePoint ? modulePoints.findIndex((point) => point.id === activePoint.id) : -1;
  const nextPoint = activeIndex >= 0 ? modulePoints[activeIndex + 1] : undefined;
  const masteredCount = modulePoints.filter((point) => getProgress(state, point.id).status === 'mastered').length;
  const allTags = ['全部', ...Array.from(new Set(modulePoints.flatMap((point) => point.tags))).slice(0, 14)];
  const isFavorite = activePoint
    ? state.favorites.some((item) => item.targetType === 'knowledge' && item.targetId === activePoint.id)
    : false;

  return (
    <div className="knowledge-workspace">
      <section className="study-track" aria-label="PDF 学习轨道">
        <div className="track-head">
          <div>
            <span>学习轨道</span>
            <h2>{module.title}</h2>
          </div>
          <small>{appData.modules.length} 份 PDF · {appData.knowledgePoints.length} 个知识点 · 当前 {modulePoints.length} 个</small>
        </div>
        <div className="module-strip">
          {appData.modules.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`module-pill ${item.id === module.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedModule(item.id);
                setSelectedPoint('');
                setTagFilter('全部');
                setQuery('');
              }}
            >
              <span>
                <strong>{item.title}</strong>
                <small>{item.area}</small>
              </span>
              <ProgressBar value={masteryForModule(state, item.id)} size="sm" />
            </button>
          ))}
        </div>
      </section>

      <div className="knowledge-columns">
        <Panel className="detail-pane learning-stage">
          {activePoint ? (
            <>
              <div className="learning-kicker">
                <span>{module.title}</span>
                <span>{activePoint.group}</span>
                <span>{activePoint.estimatedMinutes} min</span>
              </div>

              <div className="detail-title">
                <div>
                  <h2>{activePoint.title}</h2>
                  <small>围绕核心概念、常见误区、代码片段和面试追问完成一次闭环学习。</small>
                </div>
                <button
                  className={`icon-button ${isFavorite ? 'active' : ''}`}
                  type="button"
                  onClick={() => setState((current) => toggleFavorite(current, activePoint.id, 'knowledge'))}
                  aria-label="收藏知识点"
                >
                  <Bookmark size={17} />
                </button>
              </div>

              <div className="learning-actions">
                <StatusSelect
                  value={getProgress(state, activePoint.id).status}
                  onChange={(status) => setState((current) => upsertProgress(current, activePoint.id, status))}
                />
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => goTo('interview', activePoint.title)}
                >
                  下一步练习
                </button>
              </div>

              <div className="concept-list">
                {activePoint.coreConcepts.map((concept) => (
                  <article key={concept.title}>
                    <h3>{concept.title}</h3>
                    <p>
                      <SafeHtml html={concept.body} />
                    </p>
                  </article>
                ))}
              </div>

              <div className="pitfall-box">
                <strong>常见误区</strong>
                {activePoint.pitfalls.map((pitfall) => (
                  <span key={pitfall}>{pitfall}</span>
                ))}
              </div>

              {activePoint.code ? (
                <pre className="code-block">
                  <code>{activePoint.code}</code>
                </pre>
              ) : null}

              <label className="note-box">
                <span>个人笔记</span>
                <textarea
                  value={state.notes[activePoint.id] ?? ''}
                  onChange={(event) => setState((current) => updateNote(current, activePoint.id, event.target.value))}
                  placeholder="记录你的理解、追问、项目类比..."
                />
              </label>

              <div className="related-questions">
                <h3>
                  <Star size={16} />
                  关联面试题
                </h3>
                {activePoint.relatedQuestionIds.slice(0, 3).map((id) => {
                  const question = appData.questions.find((item) => item.id === id);
                  return question ? <span key={id}>{question.title}</span> : null;
                })}
              </div>
            </>
          ) : (
            <div className="empty-line">当前筛选没有知识点。</div>
          )}
        </Panel>

        <aside className="learning-aside">
          <Panel className="module-summary">
            <div className="module-header">
              <div>
                <h2>{module.title}</h2>
                <p>{module.description}</p>
                <div className="tag-row">
                  {module.tags.map((tag) => (
                    <Tag key={tag} tone={tag.includes('高频') ? 'hot' : 'neutral'}>{tag}</Tag>
                  ))}
                </div>
              </div>
              <div className="module-score">
                <strong>{masteryForModule(state, module.id)}%</strong>
                <span>掌握程度</span>
              </div>
            </div>
            <div className="module-mini-stats">
              <span>已掌握 {masteredCount}/{modulePoints.length}</span>
              <span>预计 {modulePoints.reduce((sum, point) => sum + point.estimatedMinutes, 0)} min</span>
            </div>
          </Panel>

          <Panel className="next-learning-card">
            <div className="panel-head slim">
              <h2>下一步</h2>
              <span>{activeIndex + 1}/{modulePoints.length}</span>
            </div>
            <button
              type="button"
              className="next-point-card"
              onClick={() => nextPoint ? setSelectedPoint(nextPoint.id) : goTo('interview', activePoint?.title)}
            >
              <strong>{nextPoint?.title ?? '进入面试训练'}</strong>
              <small>{nextPoint ? `${nextPoint.group} · ${nextPoint.estimatedMinutes} min` : '用当前模块开始刷题'}</small>
            </button>
          </Panel>

          <Panel className="module-main knowledge-index">
            <div className="filter-bar">
              <label>
                <Search size={15} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="筛选本模块知识点" />
              </label>
              <select value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}>
                {allTags.map((tag) => (
                  <option key={tag}>{tag}</option>
                ))}
              </select>
            </div>

            <div className="chapter-list">
              {points.length ? module.chapterIds.map((chapterId) => {
                const chapter = chapterLookup.get(chapterId);
                if (!chapter) return null;
                const chapterPoints = points.filter((point) => point.chapterId === chapter.id);
                if (!chapterPoints.length) return null;
                return (
                  <details key={chapter.id} open>
                    <summary>
                      <ChevronDown size={16} />
                      {chapter.title}
                      <span>{chapterPoints.length} 个知识点</span>
                    </summary>
                    <div className="point-list">
                      {chapterPoints.map((point) => {
                        const progress = getProgress(state, point.id);
                        return (
                          <button
                            type="button"
                            key={point.id}
                            className={`point-row ${activePoint?.id === point.id ? 'active' : ''}`}
                            onClick={() => setSelectedPoint(point.id)}
                          >
                            <span>
                              <strong>{point.title}</strong>
                              <small>{point.tags.slice(0, 3).join(' · ')}</small>
                            </span>
                            <Tag tone={progress.status === 'review' ? 'hot' : progress.status === 'mastered' ? 'green' : 'neutral'}>
                              {progress.status === 'not-started' ? '未开始' : progress.status === 'learning' ? '学习中' : progress.status === 'mastered' ? '已掌握' : '需复习'}
                            </Tag>
                          </button>
                        );
                      })}
                    </div>
                  </details>
                );
              }) : (
                <div className="empty-state compact">
                  <strong>当前筛选没有知识点</strong>
                  <p>清除关键词或标签后可查看本 PDF 的全部章节。</p>
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => {
                      setQuery('');
                      setTagFilter('全部');
                    }}
                  >
                    清除筛选
                  </button>
                </div>
              )}
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
