import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { RouteProps } from '../types';
import { Panel, Tag } from '../components/Primitives';
import { appData, moduleLookup } from '../data/appData';
import { useDebounce } from '../hooks/useDebounce';
import { searchAll, getHighlightSegments, type SearchResult } from '../lib/search';

const HighlightedText = ({ text, query }: { text: string; query: string }) => {
  const segments = getHighlightSegments(text, query);
  return (
    <>
      {segments.map((seg, i) =>
        seg.highlighted ? <mark key={i}>{seg.text}</mark> : <span key={i}>{seg.text}</span>
      )}
    </>
  );
};

export function SearchRoute({ globalQuery, goTo }: RouteProps) {
  const [query, setQuery] = useState(globalQuery);
  const [tag, setTag] = useState('全部');
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const debounce = useDebounce((value: string) => setDebouncedQuery(value), 200);

  useEffect(() => { debounce(query); }, [query, debounce]);

  const allTags = ['全部', ...Array.from(new Set([
    ...appData.knowledgePoints.flatMap((item) => item.tags),
    ...appData.scenarios.flatMap((item) => item.tags),
    ...appData.questions.map((item) => item.category)
  ])).slice(0, 20)];

  const results = useMemo(
    () => searchAll(debouncedQuery, { tag, limit: 60 }),
    [debouncedQuery, tag]
  );

  const grouped = appData.modules
    .map((module) => ({ module, items: results.filter((item) => item.moduleId === module.id) }))
    .filter((group) => group.items.length);

  const hasQuery = debouncedQuery.trim() || tag !== '全部';

  return (
    <div className="route-stack">
      <Panel>
        <div className="search-page-bar">
          <label>
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="全文搜索知识点、面试题、场景题（大小写无关）"
              autoFocus
            />
          </label>
          <select value={tag} onChange={(event) => setTag(event.target.value)}>
            {allTags.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          {hasQuery ? <span className="search-count">{results.length} 条结果</span> : null}
        </div>
      </Panel>

      {hasQuery ? (
        grouped.length ? (
          grouped.map(({ module, items }) => (
            <Panel key={module.id} title={`${module.title} · ${items.length} 条结果`}>
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
          ))
        ) : (
          <Panel>
            <div className="empty-line">
              没有找到与「{debouncedQuery || tag}」匹配的内容。请尝试其他关键词或切换标签。
            </div>
          </Panel>
        )
      ) : (
        <Panel>
          <div className="empty-line">输入关键词或选择标签后开始搜索。</div>
        </Panel>
      )}
    </div>
  );
}
