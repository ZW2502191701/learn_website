import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { RouteProps } from '../App';
import { Panel, Tag } from '../components/Primitives';
import { appData, moduleLookup } from '../data/appData';

const highlight = (text: string, query: string) => {
  if (!query) return text;
  const index = text.indexOf(query);
  if (index === -1) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark>{query}</mark>
      {text.slice(index + query.length)}
    </>
  );
};

export function SearchRoute({ globalQuery, goTo }: RouteProps) {
  const [query, setQuery] = useState(globalQuery);
  const [tag, setTag] = useState('全部');
  const allTags = ['全部', ...Array.from(new Set([...appData.knowledgePoints.flatMap((item) => item.tags), ...appData.scenarios.flatMap((item) => item.tags)])).slice(0, 18)];

  const results = useMemo(() => {
    const q = query.trim();
    if (!q && tag === '全部') return [];
    const tagOk = (tags: string[]) => tag === '全部' || tags.includes(tag);
    return [
      ...appData.knowledgePoints
        .filter((item) => tagOk(item.tags) && (!q || `${item.title} ${item.tags.join(' ')} ${item.coreConcepts.map((c) => c.body).join(' ')}`.includes(q)))
        .map((item) => ({ type: '知识点', id: item.id, title: item.title, moduleId: item.moduleId, body: item.coreConcepts[0]?.body.replace(/<[^>]+>/g, '') ?? '', route: 'modules' as const })),
      ...appData.questions
        .filter((item) => (!q || `${item.title} ${item.answer}`.includes(q)) && (tag === '全部' || item.category === tag))
        .map((item) => ({ type: '面试题', id: item.id, title: item.title, moduleId: item.moduleId, body: item.answer.replace(/<[^>]+>/g, ''), route: 'interview' as const })),
      ...appData.scenarios
        .filter((item) => tagOk(item.tags) && (!q || `${item.title} ${item.background} ${item.problem} ${item.solution.join(' ')}`.includes(q)))
        .map((item) => ({ type: '场景题', id: item.id, title: item.title, moduleId: item.moduleIds[0], body: item.problem, route: 'scenarios' as const }))
    ].slice(0, 60);
  }, [query, tag]);

  const grouped = appData.modules
    .map((module) => ({ module, items: results.filter((item) => item.moduleId === module.id) }))
    .filter((group) => group.items.length);

  return (
    <div className="route-stack">
      <Panel>
        <div className="search-page-bar">
          <label>
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="全文搜索知识点、面试题、场景题" autoFocus />
          </label>
          <select value={tag} onChange={(event) => setTag(event.target.value)}>
            {allTags.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
      </Panel>

      {grouped.length ? (
        grouped.map(({ module, items }) => (
          <Panel key={module.id} title={`${module.title} · ${items.length} 条结果`}>
            <div className="search-results">
              {items.map((item) => (
                <button type="button" key={`${item.type}-${item.id}`} onClick={() => goTo(item.route, item.title)}>
                  <div>
                    <Tag tone={item.type === '场景题' ? 'hot' : item.type === '面试题' ? 'blue' : 'neutral'}>{item.type}</Tag>
                    <h3>{highlight(item.title, query)}</h3>
                    <p>{highlight(item.body.slice(0, 150), query)}</p>
                  </div>
                  <small>{moduleLookup.get(item.moduleId)?.area}</small>
                </button>
              ))}
            </div>
          </Panel>
        ))
      ) : (
        <Panel>
          <div className="empty-line">输入关键词或选择标签后开始搜索。</div>
        </Panel>
      )}
    </div>
  );
}
