import { ArrowRight, Bookmark, ChevronDown, Clock3, FileText, ListChecks, Maximize2, Minimize2, Search, Star } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { RouteProps } from '../types';
import { ProgressBar, StatusSelect, Tag } from '../components/Primitives';
import { SafeHtml } from '../components/SafeHtml';
import { appData, chapterLookup, moduleLookup } from '../data/appData';
import { getProgress, masteryForModule, statusLabel } from '../lib/metrics';
import { toggleFavorite, updateNote, upsertProgress } from '../lib/storage';
import { useToast } from '../hooks/useToast';

const tagTone = (v: string) =>
  /高频|重点|面试|事务|锁|OOM|缓存/.test(v) ? 'hot' : /JVM|Redis|MySQL|MQ|Spring/.test(v) ? 'blue' : 'neutral';

export function ModulesRoute({ state, setState, globalQuery, goTo }: RouteProps) {
  const toast = useToast();
  const [selectedModule, setSelectedModule] = useState(appData.modules[0]?.id ?? 'collections');
  const [selectedPoint, setSelectedPoint] = useState('');
  const [tagFilter, setTagFilter] = useState('全部');
  const [query, setQuery] = useState(globalQuery);
  const [outlineOpen, setOutlineOpen] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const articleRef = useRef<HTMLElement>(null);

  const module = moduleLookup.get(selectedModule) ?? appData.modules[0];
  const modulePoints = useMemo(
    () => appData.knowledgePoints.filter((p) => p.moduleId === module.id),
    [module.id]
  );

  useEffect(() => {
    const q = globalQuery.trim();
    if (!q) return;
    const normalized = q.toLowerCase();
    const hit = appData.knowledgePoints.find((p) =>
      `${p.title} ${p.tags.join(' ')} ${p.coreConcepts.map((c) => `${c.title} ${c.body}`).join(' ')}`
        .toLowerCase().includes(normalized)
    );
    if (hit) { setSelectedModule(hit.moduleId); setSelectedPoint(hit.id); setTagFilter('全部'); setQuery(''); return; }
    setSelectedPoint(''); setTagFilter('全部'); setQuery(q);
  }, [globalQuery]);

  // Focus mode: toggle body class to hide topbar
  useEffect(() => {
    document.body.classList.toggle('focus-mode', focusMode);
    return () => document.body.classList.remove('focus-mode');
  }, [focusMode]);

  // Keyboard navigation: ↑↓ to move between points
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      const idx = points.findIndex((p) => p.id === (activePoint?.id ?? ''));
      if (e.key === 'ArrowDown' && idx < points.length - 1) setSelectedPoint(points[idx + 1].id);
      if (e.key === 'ArrowUp' && idx > 0) setSelectedPoint(points[idx - 1].id);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  });

  const points = useMemo(() => {
    const q = query.trim().toLowerCase();
    return modulePoints.filter((p) => {
      const tagOk = tagFilter === '全部' || p.tags.includes(tagFilter);
      const searchOk = !q || `${p.title} ${p.tags.join(' ')} ${p.coreConcepts.map((c) => `${c.title} ${c.body}`).join(' ')}`.toLowerCase().includes(q);
      return tagOk && searchOk;
    });
  }, [modulePoints, tagFilter, query]);

  const activePoint = points.find((p) => p.id === selectedPoint) ?? points[0];
  const activeIndex = activePoint ? modulePoints.findIndex((p) => p.id === activePoint.id) : -1;
  const nextPoint = activeIndex >= 0 ? modulePoints[activeIndex + 1] : undefined;
  const masteredCount = modulePoints.filter((p) => getProgress(state, p.id).status === 'mastered').length;
  const moduleMinutes = modulePoints.reduce((sum, p) => sum + p.estimatedMinutes, 0);
  const allTags = ['全部', ...Array.from(new Set(modulePoints.flatMap((p) => p.tags))).slice(0, 16)];
  const isFavorite = activePoint
    ? state.favorites.some((f) => f.targetType === 'knowledge' && f.targetId === activePoint.id)
    : false;
  const relatedQuestions = activePoint
    ? activePoint.relatedQuestionIds
        .map((id) => appData.questions.find((q) => q.id === id))
        .filter((q): q is NonNullable<typeof q> => Boolean(q))
        .slice(0, 3)
    : [];

  const selectModule = (moduleId: string) => { setSelectedModule(moduleId); setSelectedPoint(''); setTagFilter('全部'); setQuery(''); };
  const clearFilter = () => { setQuery(''); setTagFilter('全部'); setSelectedPoint(''); };

  return (
    <div className="reader-page">
      <section className="module-coursebar" aria-label="PDF 模块">
        <div className="coursebar-lead">
          <strong>{module.title}</strong>
          <span>{module.source} · {modulePoints.length} 个知识点 · 预计 {moduleMinutes} min</span>
        </div>
        <div className="course-tabs">
          {appData.modules.map((item) => (
            <button type="button" key={item.id} className={item.id === module.id ? 'active' : ''} onClick={() => selectModule(item.id)}>
              <span>{item.title}</span>
              <ProgressBar value={masteryForModule(state, item.id)} size="sm" />
            </button>
          ))}
        </div>
      </section>

      <div className={`reader-layout${outlineOpen && !focusMode ? '' : ' reader-layout-wide'}`}>
        <article className="reader-article" ref={articleRef}>
          {activePoint ? (
            <>
              <header className="reader-header">
                <div className="reader-meta">
                  <span>{module.area}</span>
                  <span>{activePoint.group}</span>
                  <span><Clock3 size={13} /> {activePoint.estimatedMinutes} min</span>
                  <span style={{ color: getProgress(state, activePoint.id).status === 'mastered' ? 'var(--accent)' : 'var(--muted)' }}>
                    {statusLabel[getProgress(state, activePoint.id).status]}
                  </span>
                </div>
                <div className="reader-title-row">
                  <div>
                    <h1>{activePoint.title}</h1>
                    <p>围绕核心概念、常见误区、代码片段和面试追问完成一次闭环学习。</p>
                  </div>
                  <button className={`icon-button ${isFavorite ? 'active' : ''}`} type="button"
                    onClick={() => { setState((cur) => toggleFavorite(cur, activePoint.id, 'knowledge')); toast.success(isFavorite ? '已取消收藏' : '已收藏'); }}>
                    <Bookmark size={17} />
                  </button>
                </div>
                <div className="reader-tags">
                  {activePoint.tags.map((tag) => <Tag key={tag} tone={tagTone(tag)}>{tag}</Tag>)}
                </div>
                <div className="reader-toolbar">
                  <StatusSelect
                    value={getProgress(state, activePoint.id).status}
                    onChange={(s) => { setState((cur) => upsertProgress(cur, activePoint.id, s)); toast.success(`已标记为"${statusLabel[s]}"`); }}
                  />
                  <button type="button" className="primary-btn" onClick={() => goTo('interview', activePoint.title)}>
                    去刷相关题 <ArrowRight size={15} />
                  </button>
                  <button type="button" className="ghost-btn" onClick={() => { setFocusMode((v) => !v); setOutlineOpen(focusMode); }}>
                    {focusMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                    {focusMode ? '退出专注' : '专注模式'}
                  </button>
                  <button type="button" className="ghost-btn" onClick={() => setOutlineOpen((v) => !v)}>
                    <ListChecks size={15} />
                    {outlineOpen ? '收起目录' : '打开目录'}
                  </button>
                </div>
              </header>

              <div className="reader-concepts">
                {activePoint.coreConcepts.map((concept, i) => (
                  <section key={concept.title} id={`concept-${i}`}>
                    <h2>{concept.title}</h2>
                    <div className="reader-text"><SafeHtml html={concept.body} /></div>
                  </section>
                ))}
              </div>

              {activePoint.pitfalls.length > 0 && (
                <section className="reader-pitfalls">
                  <h2>常见误区</h2>
                  <div>{activePoint.pitfalls.map((p) => <span key={p}>{p}</span>)}</div>
                </section>
              )}

              {activePoint.code && (
                <pre className="code-block reader-code"><code>{activePoint.code}</code></pre>
              )}

              <label className="note-box reader-note">
                <span>个人笔记</span>
                <textarea value={state.notes[activePoint.id] ?? ''}
                  onChange={(e) => setState((cur) => updateNote(cur, activePoint.id, e.target.value))}
                  placeholder="记录你的理解、追问、项目类比和易错边界..." />
              </label>

              {relatedQuestions.length > 0 && (
                <section className="reader-related">
                  <h2><Star size={16} /> 关联面试题</h2>
                  <div>
                    {relatedQuestions.map((q) => (
                      <button type="button" key={q.id} onClick={() => goTo('interview', q.title)}>
                        <span>{q.category}</span><strong>{q.title}</strong>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <footer className="reader-next">
                <div>
                  <span>下一步学习</span>
                  <strong>{nextPoint?.title ?? '进入面试训练'}</strong>
                  <small>{nextPoint ? `${nextPoint.group} · ${nextPoint.estimatedMinutes} min` : '用当前模块开始刷题与复盘'}</small>
                </div>
                <button type="button" className="primary-btn"
                  onClick={() => nextPoint ? setSelectedPoint(nextPoint.id) : goTo('interview', activePoint.title)}>
                  继续 <ArrowRight size={15} />
                </button>
              </footer>
            </>
          ) : (
            <div className="reader-empty">
              <FileText size={34} />
              <strong>当前筛选没有知识点</strong>
              <p>清除关键词或标签后，可以查看本 PDF 的全部章节。</p>
              <button type="button" className="primary-btn" onClick={clearFilter}>清除筛选</button>
            </div>
          )}
        </article>

        {(outlineOpen && !focusMode) && (
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

            {/* TOC from coreConcepts */}
            {activePoint && activePoint.coreConcepts.length > 0 && (
              <section className="reader-dock-card">
                <div className="dock-section-title">
                  <h2>本节大纲</h2>
                  <span>{activePoint.coreConcepts.length} 个概念</span>
                </div>
                <div style={{ display: 'grid', gap: 4 }}>
                  {activePoint.coreConcepts.map((c, i) => (
                    <button key={c.title} type="button" style={{ textAlign: 'left', padding: '6px 8px', borderRadius: 6, background: 'transparent', color: 'var(--muted)', fontSize: 13, cursor: 'pointer', border: '1px solid transparent' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)'; }}
                      onClick={() => document.getElementById(`concept-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                      {c.title}
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section className="reader-dock-card">
              <div className="dock-section-title">
                <h2>章节目录</h2>
                <span>{points.length}/{modulePoints.length}</span>
              </div>
              <div className="reader-filter">
                <label>
                  <Search size={15} />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="筛选本模块知识点" />
                </label>
                <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
                  {allTags.map((tag) => <option key={tag}>{tag}</option>)}
                </select>
              </div>
              <div className="reader-chapters">
                {points.length ? module.chapterIds.map((chapterId) => {
                  const chapter = chapterLookup.get(chapterId);
                  if (!chapter) return null;
                  const chapterPoints = points.filter((p) => p.chapterId === chapter.id);
                  if (!chapterPoints.length) return null;
                  return (
                    <details key={chapter.id} open>
                      <summary><ChevronDown size={15} /><span>{chapter.title}</span><small>{chapterPoints.length}</small></summary>
                      <div>
                        {chapterPoints.map((p) => {
                          const progress = getProgress(state, p.id);
                          return (
                            <button type="button" key={p.id} className={activePoint?.id === p.id ? 'active' : ''} onClick={() => setSelectedPoint(p.id)}>
                              <strong>{p.title}</strong>
                              <span>{p.tags.slice(0, 3).join(' · ')}</span>
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
                    <button type="button" className="ghost-btn" onClick={clearFilter}>清除筛选</button>
                  </div>
                )}
              </div>
            </section>
          </aside>
        )}
      </div>
    </div>
  );
}
