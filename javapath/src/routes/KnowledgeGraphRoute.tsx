import { Bookmark, GitBranch, MessageSquareQuote } from 'lucide-react';
import { useState } from 'react';
import type { RouteProps } from '../App';
import { Panel, Tag } from '../components/Primitives';
import { SafeHtml } from '../components/SafeHtml';
import { appData, moduleLookup, questionLookup } from '../data/appData';
import { toggleFavorite } from '../lib/storage';

const graphNodes = [
  { id: 'hashmap', label: 'HashMap', x: 90, y: 180, point: 'collections-hashmap' },
  { id: 'chm', label: 'ConcurrentHashMap', x: 275, y: 180, point: 'collections-concurrenthashmap' },
  { id: 'cas', label: 'CAS', x: 475, y: 120, point: 'threads-cas-atomic' },
  { id: 'volatile', label: 'volatile', x: 660, y: 120, point: 'threads-jmm' },
  { id: 'jmm', label: 'JMM', x: 845, y: 180, point: 'threads-jmm' },
  { id: 'jvm-memory', label: 'JVM 内存模型', x: 1040, y: 180, point: 'jvm-runtime-area' },
  { id: 'threadpool', label: '线程池', x: 470, y: 310, point: 'threads-threadpool' },
  { id: 'seckill', label: '秒杀系统', x: 685, y: 330, scenario: 'seckill-system' },
  { id: 'redis', label: 'Redis 缓存', x: 900, y: 330, point: 'redis-cache-problems' },
  { id: 'mq', label: 'MQ 可靠性', x: 1070, y: 330, scenario: 'mq-reliability' }
];

const graphEdges = [
  ['hashmap', 'chm'],
  ['chm', 'cas'],
  ['cas', 'volatile'],
  ['volatile', 'jmm'],
  ['jmm', 'jvm-memory'],
  ['threadpool', 'seckill'],
  ['redis', 'seckill'],
  ['mq', 'seckill'],
  ['seckill', 'mq']
];

export function KnowledgeGraphRoute({ state, setState, goTo }: RouteProps) {
  const [selected, setSelected] = useState(graphNodes[0]);
  const point = selected.point ? appData.knowledgePoints.find((item) => item.id === selected.point) : undefined;
  const scenario = selected.scenario ? appData.scenarios.find((item) => item.id === selected.scenario) : undefined;
  const relatedQuestions = point
    ? point.relatedQuestionIds.map((id) => questionLookup.get(id)).filter(Boolean)
    : scenario
      ? scenario.relatedQuestionIds.map((id) => questionLookup.get(id)).filter(Boolean)
      : [];

  return (
    <div className="graph-layout">
      <Panel className="graph-canvas-panel">
        <div className="graph-toolbar">
          <div>
            <h2>知识图谱</h2>
            <p>点击节点查看解释和关联面试题，重点串起源码、并发、JMM、JVM 与场景题。</p>
          </div>
          <Tag tone="green">依赖链路</Tag>
        </div>
        <svg className="knowledge-svg" viewBox="0 0 1180 430" role="img" aria-label="Java 后端知识图谱">
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="var(--muted)" />
            </marker>
          </defs>
          {graphEdges.map(([from, to]) => {
            const a = graphNodes.find((node) => node.id === from)!;
            const b = graphNodes.find((node) => node.id === to)!;
            return (
              <line
                key={`${from}-${to}`}
                x1={a.x + 72}
                y1={a.y}
                x2={b.x - 72}
                y2={b.y}
                markerEnd="url(#arrow)"
                className="graph-edge"
              />
            );
          })}
          {graphNodes.map((node) => (
            <g key={node.id} className={`graph-node ${selected.id === node.id ? 'selected' : ''}`} onClick={() => setSelected(node)}>
              <rect x={node.x - 76} y={node.y - 28} width="152" height="56" rx="8" />
              <text x={node.x} y={node.y + 5} textAnchor="middle">
                {node.label}
              </text>
            </g>
          ))}
        </svg>
      </Panel>

      <Panel className="graph-detail">
        <div className="detail-title">
          <div>
            <h2>{selected.label}</h2>
            <small>{point ? moduleLookup.get(point.moduleId)?.title : '场景实战'}</small>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={() => {
              if (point) setState((current) => toggleFavorite(current, point.id, 'knowledge'));
              if (scenario) setState((current) => toggleFavorite(current, scenario.id, 'scenario'));
            }}
          >
            <Bookmark size={17} />
          </button>
        </div>

        {point ? (
          <>
            <div className="tag-row">
              {point.tags.slice(0, 5).map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>
            <div className="concept-list compact">
              {point.coreConcepts.slice(0, 3).map((concept) => (
                <article key={concept.title}>
                  <h3>{concept.title}</h3>
                  <p>
                    <SafeHtml html={concept.body} />
                  </p>
                </article>
              ))}
            </div>
          </>
        ) : scenario ? (
          <div className="concept-list compact">
            <article>
              <h3>背景</h3>
              <p>{scenario.background}</p>
            </article>
            <article>
              <h3>分析路径</h3>
              <p>{scenario.analysisPath.join(' → ')}</p>
            </article>
          </div>
        ) : null}

        <div className="related-questions">
          <h3>
            <MessageSquareQuote size={16} />
            关联面试题
          </h3>
          {relatedQuestions.slice(0, 5).map((question) => (
            <button type="button" key={question!.id} onClick={() => goTo('interview', question!.title)}>
              {question!.title}
            </button>
          ))}
        </div>

        <div className="graph-hint">
          <GitBranch size={16} />
          推荐表达：先讲依赖关系，再讲底层机制，最后落到项目场景和故障边界。
        </div>
      </Panel>
    </div>
  );
}
