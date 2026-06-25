import { Bookmark, ChevronDown, Search, Star } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { RouteProps } from '../App';
import { Panel, ProgressBar, StatusSelect, Tag } from '../components/Primitives';
import { SafeHtml } from '../components/SafeHtml';
import { appData, chapterLookup, moduleLookup } from '../data/appData';
import { getProgress, masteryForModule } from '../lib/metrics';
import { toggleFavorite, updateNote, upsertProgress } from '../lib/storage';

export function ModulesRoute({ state, setState, globalQuery }: RouteProps) {
  const [selectedModule, setSelectedModule] = useState(appData.modules[0]?.id ?? 'collections');
  const [selectedPoint, setSelectedPoint] = useState('');
  const [tagFilter, setTagFilter] = useState('全部');
  const [query, setQuery] = useState(globalQuery);

  const module = moduleLookup.get(selectedModule) ?? appData.modules[0];
  const points = useMemo(() => {
    const raw = appData.knowledgePoints.filter((point) => point.moduleId === module.id);
    return raw.filter((point) => {
      const tagOk = tagFilter === '全部' || point.tags.includes(tagFilter);
      const q = query.trim();
      const searchOk =
        !q ||
        `${point.title} ${point.tags.join(' ')} ${point.coreConcepts.map((item) => item.title + item.body).join(' ')}`.includes(q);
      return tagOk && searchOk;
    });
  }, [module.id, tagFilter, query]);

  const activePoint = appData.knowledgePoints.find((point) => point.id === selectedPoint) ?? points[0];
  const allTags = ['全部', ...Array.from(new Set(appData.knowledgePoints.filter((point) => point.moduleId === module.id).flatMap((point) => point.tags))).slice(0, 14)];
  const isFavorite = activePoint
    ? state.favorites.some((item) => item.targetType === 'knowledge' && item.targetId === activePoint.id)
    : false;

  return (
    <div className="modules-layout">
      <Panel className="module-rail">
        <div className="rail-title">PDF 模块</div>
        {appData.modules.map((item) => (
          <button
            type="button"
            key={item.id}
            className={`module-tab ${item.id === module.id ? 'active' : ''}`}
            onClick={() => {
              setSelectedModule(item.id);
              setSelectedPoint('');
            }}
          >
            <span>
              <strong>{item.title}</strong>
              <small>{item.area} · {item.source}</small>
            </span>
            <ProgressBar value={masteryForModule(state, item.id)} size="sm" />
          </button>
        ))}
      </Panel>

      <div className="module-main">
        <Panel>
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
        </Panel>

        <Panel>
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
            {module.chapterIds.map((chapterId) => {
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
            })}
          </div>
        </Panel>
      </div>

      <Panel className="detail-pane">
        {activePoint ? (
          <>
            <div className="detail-title">
              <div>
                <h2>{activePoint.title}</h2>
                <small>{module.title} · {activePoint.group} · {activePoint.estimatedMinutes} min</small>
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

            <StatusSelect
              value={getProgress(state, activePoint.id).status}
              onChange={(status) => setState((current) => upsertProgress(current, activePoint.id, status))}
            />

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
    </div>
  );
}
