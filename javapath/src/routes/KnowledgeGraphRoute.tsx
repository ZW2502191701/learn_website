import { Bookmark, GitBranch, MessageSquareQuote, RotateCcw, Star } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { RouteProps } from '../types';
import { Panel, ProgressBar, Tag } from '../components/Primitives';
import { SafeHtml } from '../components/SafeHtml';
import { appData, knowledgeLookup, moduleLookup, questionLookup, scenarioLookup } from '../data/appData';
import { getProgress, masteryForModule, statusLabel } from '../lib/metrics';
import { toggleFavorite, upsertProgress } from '../lib/storage';

// ── 图谱节点定义 ───────────────────────────────────────────────────
const graphNodesRaw = [
  { id: 'hashmap', label: 'HashMap', x: 90, y: 180, point: 'collections-hashmap' },
  { id: 'chm', label: 'ConcurrentHashMap', x: 275, y: 180, point: 'collections-concurrenthashmap' },
  { id: 'cas', label: 'CAS', x: 475, y: 120, point: 'threads-cas-atomic' },
  { id: 'volatile', label: 'volatile', x: 660, y: 120, point: 'threads-jmm' },
  { id: 'jmm', label: 'JMM', x: 845, y: 180, point: 'threads-jmm' },
  { id: 'jvm-memory', label: 'JVM 内存模型', x: 1040, y: 180, point: 'jvm-runtime-area' },
  { id: 'threadpool', label: '线程池', x: 470, y: 310, point: 'threads-threadpool' },
  { id: 'seckill', label: '秒杀系统', x: 685, y: 330, scenario: 'seckill-system' },
  { id: 'redis', label: 'Redis 缓存', x: 900, y: 330, point: 'redis-cache-problem' },
  { id: 'mq', label: 'MQ 可靠性', x: 1070, y: 330, scenario: 'mq-reliability' }
];

const graphEdgesRaw: Array<[string, string]> = [
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

// ── 过滤无效引用 ───────────────────────────────────────────────────
const validNodeIds = new Set(graphNodesRaw.map((n) => n.id));
const graphNodes = graphNodesRaw.filter((node) => {
  const hasPoint = node.point ? knowledgeLookup.has(node.point) : true;
  const hasScenario = node.scenario ? scenarioLookup.has(node.scenario) : true;
  if (!hasPoint) console.warn(`[graph] 节点 "${node.id}" 引用了不存在的知识点 "${node.point}"`);
  if (!hasScenario) console.warn(`[graph] 节点 "${node.id}" 引用了不存在的场景 "${node.scenario}"`);
  return hasPoint && hasScenario;
});

const graphNodeIds = new Set(graphNodes.map((n) => n.id));
const graphEdges = graphEdgesRaw.filter(([from, to]) => graphNodeIds.has(from) && graphNodeIds.has(to));

// ── 节点状态映射 ───────────────────────────────────────────────────
type NodeStatus = 'not-started' | 'learning' | 'mastered' | 'review' | 'wrong' | 'scenario';

const getNodeStatus = (node: typeof graphNodes[0], state: RouteProps['state']): NodeStatus => {
  if (node.point) {
    const progress = getProgress(state, node.point);
    const hasWrong = state.wrongQuestions.some((w) => {
      const q = questionLookup.get(w.questionId);
      return q?.knowledgePointId === node.point;
    });
    if (hasWrong) return 'wrong';
    return progress.status;
  }
  return 'scenario';
};

const statusTone: Record<NodeStatus, string> = {
  'not-started': 'node-not-started',
  'learning': 'node-learning',
  'mastered': 'node-mastered',
  'review': 'node-review',
  'wrong': 'node-wrong',
  'scenario': 'node-scenario'
};

const statusTagTone: Record<NodeStatus, 'neutral' | 'blue' | 'green' | 'hot' | 'neutral'> = {
  'not-started': 'neutral',
  'learning': 'blue',
  'mastered': 'green',
  'review': 'hot',
  'wrong': 'hot',
  'scenario': 'neutral'
};

// ── 组件 ───────────────────────────────────────────────────────────
export function KnowledgeGraphRoute({ state, setState, goTo }: RouteProps) {
  const [selected, setSelected] = useState(graphNodes[0]);
  const selectedNode = graphNodes.find((n) => n.id === selected.id) ?? graphNodes[0];

  const point = selectedNode.point ? knowledgeLookup.get(selectedNode.point) : undefined;
  const scenario = selectedNode.scenario ? scenarioLookup.get(selectedNode.scenario) : undefined;
  const nodeStatus = getNodeStatus(selectedNode, state);
  const module = point ? moduleLookup.get(point.moduleId) : undefined;
  const moduleMastery = module ? masteryForModule(state, module.id) : undefined;

  const relatedQuestions = point
    ? point.relatedQuestionIds.map((id) => questionLookup.get(id)).filter(Boolean)
    : scenario
      ? scenario.relatedQuestionIds.map((id) => questionLookup.get(id)).filter(Boolean)
      : [];

  const dependencies = point
    ? point.dependencies.map((id) => knowledgeLookup.get(id)).filter(Boolean)
    : [];

  // 计算图谱整体统计
  const graphStats = useMemo(() => {
    const pointNodes = graphNodes.filter((n) => n.point);
    const mastered = pointNodes.filter((n) => getProgress(state, n.point!).status === 'mastered').length;
    return { total: pointNodes.length, mastered };
  }, [state]);

  return (
    <div className="graph-layout">
      <Panel className="graph-canvas-panel">
        <div className="graph-toolbar">
          <div>
            <h2>知识图谱</h2>
            <p>点击节点查看解释和关联面试题，重点串起源码、并发、JMM、JVM 与场景题。</p>
          </div>
          <div className="graph-stats">
            <Tag tone="green">已掌握 {graphStats.mastered}/{graphStats.total}</Tag>
            <Tag tone="blue">依赖链路</Tag>
          </div>
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
          {graphNodes.map((node) => {
            const status = getNodeStatus(node, state);
            return (
              <g
                key={node.id}
                className={`graph-node ${statusTone[status]} ${selectedNode.id === node.id ? 'selected' : ''}`}
                onClick={() => setSelected(node)}
              >
                <rect x={node.x - 76} y={node.y - 28} width="152" height="56" rx="8" />
                <text x={node.x} y={node.y + 5} textAnchor="middle">
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="graph-legend">
          <span className="legend-item"><i className="legend-dot dot-not-started" />未开始</span>
          <span className="legend-item"><i className="legend-dot dot-learning" />学习中</span>
          <span className="legend-item"><i className="legend-dot dot-mastered" />已掌握</span>
          <span className="legend-item"><i className="legend-dot dot-review" />需复习</span>
          <span className="legend-item"><i className="legend-dot dot-wrong" />有错题</span>
          <span className="legend-item"><i className="legend-dot dot-scenario" />场景题</span>
        </div>
      </Panel>

      <Panel className="graph-detail">
        <div className="detail-title">
          <div>
            <h2>{selectedNode.label}</h2>
            <small>{module?.title ?? (scenario ? '场景实战' : '')}</small>
          </div>
          <div className="compact-actions">
            {point && (
              <button
                type="button"
                className="ghost-btn"
                onClick={() => setState((current) => upsertProgress(current, point.id, nodeStatus === 'mastered' ? 'review' : 'mastered'))}
              >
                {nodeStatus === 'mastered' ? '标记需复习' : '标记已掌握'}
              </button>
            )}
            <button
              type="button"
              className={`icon-button ${
                (point && state.favorites.some((f) => f.targetId === point.id && f.targetType === 'knowledge')) ||
                (scenario && state.favorites.some((f) => f.targetId === scenario.id && f.targetType === 'scenario'))
                  ? 'active' : ''
              }`}
              onClick={() => {
                if (point) setState((current) => toggleFavorite(current, point.id, 'knowledge'));
                if (scenario) setState((current) => toggleFavorite(current, scenario.id, 'scenario'));
              }}
            >
              <Bookmark size={17} />
            </button>
          </div>
        </div>

        {/* 状态和进度 */}
        <div className="graph-node-meta">
          <Tag tone={statusTagTone[nodeStatus]}>{nodeStatus === 'scenario' ? '场景题' : statusLabel[nodeStatus === 'wrong' ? 'review' : nodeStatus]}</Tag>
          {module && moduleMastery !== undefined && (
            <span className="graph-module-mastery">
              模块掌握度 {moduleMastery}%
              <ProgressBar value={moduleMastery} size="sm" />
            </span>
          )}
        </div>

        {/* 知识点详情 */}
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
            {point.pitfalls.length > 0 && (
              <div className="pitfall-box compact">
                <strong>常见误区</strong>
                {point.pitfalls.slice(0, 2).map((p) => (
                  <span key={p}>{p}</span>
                ))}
              </div>
            )}
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
            <article>
              <h3>解决方案</h3>
              <p>{scenario.solution.slice(0, 3).join('；')}</p>
            </article>
          </div>
        ) : null}

        {/* 前置依赖 */}
        {dependencies.length > 0 && (
          <div className="graph-dependencies">
            <h3>
              <GitBranch size={15} />
              前置依赖
            </h3>
            <div>
              {dependencies.map((dep) => (
                <button
                  type="button"
                  key={dep!.id}
                  onClick={() => {
                    const node = graphNodes.find((n) => n.point === dep!.id);
                    if (node) setSelected(node);
                  }}
                >
                  {dep!.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 关联面试题 */}
        <div className="related-questions">
          <h3>
            <MessageSquareQuote size={16} />
            关联面试题
          </h3>
          {relatedQuestions.length > 0 ? (
            relatedQuestions.slice(0, 5).map((question) => (
              <button type="button" key={question!.id} onClick={() => goTo('interview', question!.title)}>
                {question!.title}
              </button>
            ))
          ) : (
            <span className="empty-line compact">暂无关联面试题</span>
          )}
        </div>

        {/* 复习建议 */}
        {point && (nodeStatus === 'not-started' || nodeStatus === 'review' || nodeStatus === 'wrong') && (
          <div className="graph-review-suggestion">
            <RotateCcw size={15} />
            <div>
              <strong>
                {nodeStatus === 'wrong' ? '该知识点有错题，建议优先复盘' :
                 nodeStatus === 'review' ? '该知识点标记为需复习' :
                 '该知识点尚未开始学习'}
              </strong>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => {
                  setState((current) => upsertProgress(current, point.id, 'learning'));
                  goTo('modules', point.title);
                }}
              >
                去学习
              </button>
            </div>
          </div>
        )}

        <div className="graph-hint">
          <Star size={16} />
          推荐表达：先讲依赖关系，再讲底层机制，最后落到项目场景和故障边界。
        </div>
      </Panel>
    </div>
  );
}
