import { ArrowRight, Bookmark, ChevronDown, Clock3, FileText, ListChecks, Search, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { RouteProps } from '../types';
import { ProgressBar, StatusSelect, Tag } from '../components/Primitives';
import { SafeHtml } from '../components/SafeHtml';
import { appData, chapterLookup, moduleLookup } from '../data/appData';
import { getProgress, masteryForModule, statusLabel } from '../lib/metrics';
import { toggleFavorite, updateNote, upsertProgress } from '../lib/storage';

const tagTone = (value: string) => {
  if (/高频|重点|面试|事务|锁|OOM|缓存/.test(value)) return 'hot';
  if (/JVM|Redis|MySQL|MQ|Spring/.test(value)) return 'blue';
  return 'neutral';
};

export function ModulesRoute({ state, setState, globalQuery, goTo }: RouteProps) {
  const [selectedModule, setSelectedModule] = useState(appData.modules[0]?.id ?? 'collections');
  const [selectedPoint, setSelectedPoint] = useState('');
  const [tagFilter, setTagFilter] = useState('全部');
  const [query, setQuery] = useState(globalQuery);
  const [outlineOpen, setOutlineOpen] = useState(true);

  const module = moduleLookup.get(selectedModule) ?? appData.modules[0];
  const modulePoints = useMemo(
    () => appData.knowledgePoints.filter((point) => point.moduleId === module.id),
    [module.id]
  );

  useEffect(() => {
    const q = globalQuery.trim();
    if (!q) return;

    const normalized = q.toLowerCase();
    const hit = appData.knowledgePoints.find((point) =>
      `${point.title} ${point.tags.join(' ')} ${point.coreConcepts.map((item) => `${item.title} ${item.body}`).join(' ')}`
        .toLowerCase()
        .includes(normalized)
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
    const q = query.trim().toLowerCase();
    return modulePoints.filter((point) => {
      const tagOk = tagFilter === '全部' || point.tags.includes(tagFilter);
      const searchOk =
        !q ||
        `${point.title} ${point.tags.join(' ')} ${point.coreConcepts.map((item) => `${item.title} ${item.body}`).join(' ')}`
          .toLowerCase()
          .includes(q);
      return tagOk && searchOk;
    });
  }, [modulePoints, tagFilter, query]);

  const activePoint = points.find((point) => point.id === selectedPoint) ?? points[0];
  const activeIndex = activePoint ? modulePoints.findIndex((point) => point.id === activePoint.id) : -1;
  const nextPoint = activeIndex >= 0 ? modulePoints[activeIndex + 1] : undefined;
  const masteredCount = modulePoints.filter((point) => getProgress(state, point.id).status === 'mastered').length;
  const moduleMinutes = modulePoints.reduce((sum, point) => sum + point.estimatedMinutes, 0);
  const allTags = ['全部', ...Array.from(new Set(modulePoints.flatMap((point) => point.tags))).slice(0, 16)];
  const isFavorite = activePoint
    ? state.favorites.some((item) => item.targetType === 'knowledge' && item.targetId === activePoint.id)
    : false;
  const relatedQuestions = activePoint
    ? activePoint.relatedQuestionIds
        .map((id) => appData.questions.find((item) => item.id === id))
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
        .slice(0, 3)
    : [];

  const selectModule = (moduleId: string) => {
    setSelectedModule(moduleId);
    setSelectedPoint('');
    setTagFilter('全部');
    setQuery('');
  };

  const clearFilter = () => {
    setQuery('');
    setTagFilter('全部');
    setSelectedPoint('');
  };

  return (
    <div className="reader-page">
      <section className="module-coursebar" aria-label="PDF 模块">
        <div className="coursebar-lead">
          <strong>{module.title}</strong>
          <span>{module.source} · {modulePoints.length} 个知识点 · 预计 {moduleMinutes} min</span>
        </div>
        <div className="course-tabs">
          {appData.modules.map((item) => (
            <button
              type="button"
              key={item.id}
              className={item.id === module.id ? 'active' : ''}
              onClick={() => selectModule(item.id)}
            >
              <span>{item.title}</span>
              <ProgressBar value={masteryForModule(state, item.id)} size="sm" />
            </button>
          ))}
        </div>
      </section>

      <div className={`reader-layout ${outlineOpen ? '' : 'reader-layout-wide'}`}>
        <article className="reader-article">
          {activePoint ? (
            <>
              <header className="reader-header">
                <div className="reader-meta">
                  <span>{module.area}</span>
                  <span>{activePoint.group}</span>
                  <span>
                    <Clock3 size={13} />
                    {activePoint.estimatedMinutes} min
                  </span>
                </div>
                <div className="reader-title-row">
                  <div>
                    <h1>{activePoint.title}</h1>
                    <p>围绕核心概念、常见误区、代码片段和面试追问完成一次闭环学习。</p>
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

                <div className="reader-tags">
                  {activePoint.tags.map((tag) => (
                    <Tag key={tag} tone={tagTone(tag)}>{tag}</Tag>
                  ))}
                </div>

                <div className="reader-toolbar">
                  <StatusSelect
                    value={getProgress(state, activePoint.id).status}
                    onChange={(status) => setState((current) => upsertProgress(current, activePoint.id, status))}
                  />
                  <button type="button" className="primary-btn" onClick={() => goTo('interview', activePoint.title)}>
                    去刷相关题
                    <ArrowRight size={15} />
                  </button>
                  <button type="button" className="ghost-btn" onClick={() => setOutlineOpen((value) => !value)}>
                    <ListChecks size={15} />
                    {outlineOpen ? '收起目录' : '打开目录'}
                  </button>
                </div>
              </header>

              <div className="reader-concepts">
                {activePoint.coreConcepts.map((concept) => (
                  <section key={concept.title}>
                    <h2>{concept.title}</h2>
                    <div className="reader-text">
                      <SafeHtml html={concept.body} />
                    </div>
                  </section>
                ))}
              </div>

              <section className="reader-pitfalls">
                <h2>常见误区</h2>
                <div>
                  {activePoint.pitfalls.map((pitfall) => (
                    <span key={pitfall}>{pitfall}</span>
                  ))}
                </div>
              </section>

              {activePoint.code ? (
                <pre className="code-block reader-code">
                  <code>{activePoint.code}</code>
                </pre>
              ) : null}

              <label className="note-box reader-note">
                <span>个人笔记</span>
                <textarea
                  value={state.notes[activePoint.id] ?? ''}
                  onChange={(event) => setState((current) => updateNote(current, activePoint.id, event.target.value))}
                  placeholder="记录你的理解、追问、项目类比和易错边界..."
                />
              </label>

              <section className="reader-related">
                <h2>
                  <Star size={16} />
                  关联面试题
                </h2>
                <div>
                  {relatedQuestions.map((question) => (
                    <button type="button" key={question.id} onClick={() => goTo('interview', question.title)}>
                      <span>{question.category}</span>
                      <strong>{question.title}</strong>
                    </button>
                  ))}
                </div>
              </section>

              <footer className="reader-next">
                <div>
                  <span>下一步学习</span>
                  <strong>{nextPoint?.title ?? '进入面试训练'}</strong>
                  <small>{nextPoint ? `${nextPoint.group} · ${nextPoint.estimatedMinutes} min` : '用当前模块开始刷题与复盘'}</small>
                </div>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => nextPoint ? setSelectedPoint(nextPoint.id) : goTo('interview', activePoint.title)}
                >
                  继续
                  <ArrowRight size={15} />
                </button>
              </footer>
            </>
          ) : (
            <div className="reader-empty">
              <FileText size={34} />
              <strong>当前筛选没有知识点</strong>
              <p>清除关键词或标签后，可以查看本 PDF 的全部章节。</p>
              <button type="button" className="primary-btn" onClick={clearFilter}>
                清除筛选
              </button>
            </div>
          )}
        </article>

        {outlineOpen ? (
          <aside className="reader-dock" aria-label="学习辅助">
            <section className="reader-dock-card module-digest">
              <div>
                <strong>{module.title}</strong>
                <p>{module.description}</p>
              </div>
              <div className="digest-score">
                <strong>{masteryForModule(state, module.id)}%</strong>
                <span>掌握度</span>
              </div>
              <ProgressBar value={masteryForModule(state, module.id)} />
              <div className="digest-meta">
                <span>已掌握 {masteredCount}/{modulePoints.length}</span>
                <span>重要度 {module.importance}</span>
              </div>
            </section>

            <section className="reader-dock-card">
              <div className="dock-section-title">
                <h2>章节目录</h2>
                <span>{points.length}/{modulePoints.length}</span>
              </div>
              <div className="reader-filter">
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

              <div className="reader-chapters">
                {points.length ? module.chapterIds.map((chapterId) => {
                  const chapter = chapterLookup.get(chapterId);
                  if (!chapter) return null;
                  const chapterPoints = points.filter((point) => point.chapterId === chapter.id);
                  if (!chapterPoints.length) return null;
                  return (
                    <details key={chapter.id} open>
                      <summary>
                        <ChevronDown size={15} />
                        <span>{chapter.title}</span>
                        <small>{chapterPoints.length}</small>
                      </summary>
                      <div>
                        {chapterPoints.map((point) => {
                          const progress = getProgress(state, point.id);
                          return (
                            <button
                              type="button"
                              key={point.id}
                              className={activePoint?.id === point.id ? 'active' : ''}
                              onClick={() => setSelectedPoint(point.id)}
                            >
                              <strong>{point.title}</strong>
                              <span>{point.tags.slice(0, 3).join(' · ')}</span>
                              <small>{statusLabel[progress.status]}</small>
                            </button>
                          );
                        })}
                      </div>
                    </details>
                  );
                }) : (
                  <div className="reader-empty compact">
                    <strong>没有匹配知识点</strong>
                    <p>当前标签或关键词过窄。</p>
                    <button type="button" className="ghost-btn" onClick={clearFilter}>
                      清除筛选
                    </button>
                  </div>
                )}
              </div>
            </section>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
