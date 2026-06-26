import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { RouteProps } from '../types';
import { Panel, Tag } from '../components/Primitives';
import { appData, moduleLookup } from '../data/appData';
import { useDebounce } from '../hooks/useDebounce';
import { searchAll, getHighlightSegments } from '../lib/search';

const PAGE_SIZE = 20;

const HighlightedText = ({ text, query }: { text: string; query: string }) => (
  <>
    {getHighlightSegments(text, query).map((seg, i) =>
      seg.highlighted ? <mark key={i}>{seg.text}</mark> : <span key={i}>{seg.text}</span>
    )}
  </>
);

export function SearchRoute({ globalQuery, goTo }: RouteProps) {
  const [query, setQuery] = useState(globalQuery);
  const [tag, setTag] = useState('全部');
  const [difficulty, setDifficulty] = useState(0);
  const [page, setPage] = useState(1);
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const debounce = useDebounce((v: string) => setDebouncedQuery(v), 200);
  useEffect(() => { debounce(query); }, [query, debounce]);
  useEffect(() => { setPage(1); }, [debouncedQuery, tag, difficulty]);

  const allTags = ['全部', ...Array.from(new Set([
    ...appData.knowledgePoints.flatMap((p) => p.tags),
    ...appData.scenarios.flatMap((s) => s.tags),
    ...appData.questions.map((q) => q.category)
  ])).slice(0, 20)];

  const results = useMemo(
    () => searchAll(debouncedQuery, { tag, limit: 300 }).filter((r) =>
      difficulty === 0 ? true : (r as { difficulty?: number }).difficulty === difficulty
    ),
    [debouncedQuery, tag, difficulty]
  );

  const totalPages = Math.ceil(results.length / PAGE_SIZE);
  const paged = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const grouped = appData.modules
    .map((m) => ({ module: m, items: paged.filter((r) => r.moduleId === m.id) }))
    .filter((g) => g.items.length);
  const hasQuery = debouncedQuery.trim() || tag !== '全部' || difficulty > 0;

  return (
    <div className="route-stack">
      <Panel>
        <div className="search-page-bar">
          <label>
            <Search size={18} />
            <input value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="全文搜索知识点、面试题、场景题" autoFocus />
          </label>
          <select value={tag} onChange={(e) => setTag(e.target.value)}>
            {allTags.map((t) => <option key={t}>{t}</option>)}
          </select>
          <select value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value))}
            title="按难度筛选" style={{ minWidth: 100 }}>
            <option value={0}>全部难度</option>
            {[1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>难度 {d}</option>)}
          </select>
          {hasQuery && <span className="search-count">{results.length} 条结果</span>}
        </div>
      </Panel>

      {hasQuery ? grouped.length ? (
        <>
          {grouped.map(({ module, items }) => (
            <Panel key={module.id} title={`${module.title} · ${items.length} 条`}>
              <div className="search-results">
                {items.map((item) => (
                  <button type="button" key={`${item.type}-${item.id}`} onClick={() => goTo(item.route, item.title)}>
                    <div>
                      <Tag tone={item.type === '场景题' ? 'hot' : item.type === '面试题' ? 'blue' : 'neutral'}>{item.type}</Tag>
                      <h3><HighlightedText text={item.title} query={debouncedQuery} /></h3>
                      <p><HighlightedText text={item.body.slice(0, 160)} query={debouncedQuery} /></p>
                    </div>
                    <small>{moduleLookup.get(item.moduleId)?.area}</small>
                  </button>
                ))}
              </div>
            </Panel>
          ))}
          {totalPages > 1 && (
            <Panel>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
                <button className="ghost-btn" type="button" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>上一页</button>
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>{page} / {totalPages}</span>
                <button className="ghost-btn" type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>下一页</button>
              </div>
            </Panel>
          )}
        </>
      ) : (
        <Panel><div className="empty-line">没有找到与「{debouncedQuery || tag}」匹配的内容。</div></Panel>
      ) : (
        <Panel><div className="empty-line">输入关键词或选择标签后开始搜索。</div></Panel>
      )}
    </div>
  );
}
