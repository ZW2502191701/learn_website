import { Bookmark, GitBranch, MessageSquareQuote, RotateCcw, Star, ZoomIn, ZoomOut } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import type { RouteProps } from '../types';
import { Panel, ProgressBar, Tag } from '../components/Primitives';
import { SafeHtml } from '../components/SafeHtml';
import { appData, knowledgeLookup, moduleLookup, questionLookup, scenarioLookup } from '../data/appData';
import { getProgress, masteryForModule, statusLabel } from '../lib/metrics';
import { toggleFavorite, upsertProgress } from '../lib/storage';

type NodeStatus = 'not-started' | 'learning' | 'mastered' | 'review' | 'wrong' | 'scenario';

// ── Build dynamic graph from data ─────────────────────────────────

interface GraphNode { id: string; label: string; pointId?: string; scenarioId?: string; moduleId?: string; }
interface GraphEdge { from: string; to: string; }

function buildGraph() {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const seen = new Set<string>();

  // Add knowledge points that have dependencies
  for (const p of appData.knowledgePoints) {
    if (p.dependencies.length > 0 || appData.knowledgePoints.some((o) => o.dependencies.includes(p.id))) {
      if (!seen.has(p.id)) { nodes.push({ id: p.id, label: p.title.slice(0, 14), pointId: p.id, moduleId: p.moduleId }); seen.add(p.id); }
      for (const dep of p.dependencies) {
        if (!seen.has(dep)) {
          const dep_ = knowledgeLookup.get(dep);
          if (dep_) { nodes.push({ id: dep, label: dep_.title.slice(0, 14), pointId: dep, moduleId: dep_.moduleId }); seen.add(dep); }
        }
        edges.push({ from: dep, to: p.id });
      }
    }
  }

  // Add scenarios (up to 8)
  for (const s of appData.scenarios.slice(0, 8)) {
    if (!seen.has(s.id)) { nodes.push({ id: s.id, label: s.title.slice(0, 14), scenarioId: s.id }); seen.add(s.id); }
    for (const mid of s.moduleIds.slice(0, 2)) {
      const related = appData.knowledgePoints.find((p) => p.moduleId === mid && seen.has(p.id));
      if (related) edges.push({ from: related.id, to: s.id });
    }
  }

  // Fallback: if no dependency-linked points exist, use first 12 points from each module
  if (nodes.filter((n) => n.pointId).length < 3) {
    for (const m of appData.modules.slice(0, 4)) {
      const pts = appData.knowledgePoints.filter((p) => p.moduleId === m.id).slice(0, 3);
      for (const p of pts) {
        if (!seen.has(p.id)) { nodes.push({ id: p.id, label: p.title.slice(0, 14), pointId: p.id, moduleId: p.moduleId }); seen.add(p.id); }
      }
    }
  }

  return { nodes: nodes.slice(0, 40), edges };
}

// ── Simple force-directed layout ─────────────────────────────────

function forceLayout(nodes: GraphNode[], edges: GraphEdge[]) {
  const W = 1200, H = 480;
  const pos: Record<string, { x: number; y: number }> = {};

  // Initialize in circle
  nodes.forEach((n, i) => {
    const angle = (2 * Math.PI * i) / nodes.length;
    pos[n.id] = { x: W / 2 + Math.cos(angle) * (Math.min(W, H) * 0.38), y: H / 2 + Math.sin(angle) * (H * 0.38) };
  });

  // Run iterations
  for (let iter = 0; iter < 80; iter++) {
    const force: Record<string, { fx: number; fy: number }> = {};
    nodes.forEach((n) => { force[n.id] = { fx: 0, fy: 0 }; });

    // Repulsion
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = pos[nodes[i].id], b = pos[nodes[j].id];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        const f = 12000 / (dist * dist);
        force[nodes[i].id].fx += (dx / dist) * f;
        force[nodes[i].id].fy += (dy / dist) * f;
        force[nodes[j].id].fx -= (dx / dist) * f;
        force[nodes[j].id].fy -= (dy / dist) * f;
      }
    }

    // Spring attraction for edges
    for (const e of edges) {
      const a = pos[e.from], b = pos[e.to];
      if (!a || !b) continue;
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      const ideal = 200;
      const f = (dist - ideal) * 0.04;
      force[e.from].fx += (dx / dist) * f;
      force[e.from].fy += (dy / dist) * f;
      force[e.to].fx -= (dx / dist) * f;
      force[e.to].fy -= (dy / dist) * f;
    }

    // Apply + clamp
    for (const n of nodes) {
      pos[n.id].x = Math.max(80, Math.min(W - 80, pos[n.id].x + force[n.id].fx * 0.5));
      pos[n.id].y = Math.max(30, Math.min(H - 30, pos[n.id].y + force[n.id].fy * 0.5));
    }
  }
  return pos;
}

// ── Module hue palette ────────────────────────────────────────────
function moduleHue(moduleId: string) {
  let h = 0;
  for (let i = 0; i < moduleId.length; i++) h = (h * 31 + moduleId.charCodeAt(i)) % 360;
  return h;
}

export function KnowledgeGraphRoute({ state, setState, goTo }: RouteProps) {
  const { nodes, edges } = useMemo(buildGraph, []);
  const pos = useMemo(() => forceLayout(nodes, edges), [nodes, edges]);

  const [selectedId, setSelectedId] = useState(nodes[0]?.id ?? '');
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const dragRef = useRef<{ startX: number; startY: number; tx: number; ty: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const selected = nodes.find((n) => n.id === selectedId) ?? nodes[0];
  const point = selected?.pointId ? knowledgeLookup.get(selected.pointId) : undefined;
  const scenario = selected?.scenarioId ? scenarioLookup.get(selected.scenarioId) : undefined;
  const module = selected?.moduleId ? moduleLookup.get(selected.moduleId) : point ? moduleLookup.get(point.moduleId) : undefined;
  const moduleMastery = module ? masteryForModule(state, module.id) : undefined;

  const getStatus = (node: typeof nodes[0]): NodeStatus => {
    if (node.scenarioId) return 'scenario';
    if (!node.pointId) return 'not-started';
    const pr = getProgress(state, node.pointId);
    const hasWrong = state.wrongQuestions.some((w) => {
      const q = questionLookup.get(w.questionId);
      return q?.knowledgePointId === node.pointId;
    });
    if (hasWrong) return 'wrong';
    return pr.status;
  };

  const relatedQuestions = point
    ? point.relatedQuestionIds.map((id) => questionLookup.get(id)).filter(Boolean)
    : scenario ? scenario.relatedQuestionIds.map((id) => questionLookup.get(id)).filter(Boolean) : [];

  const dependencies = point
    ? point.dependencies.map((id) => knowledgeLookup.get(id)).filter(Boolean) : [];

  const graphStats = useMemo(() => {
    const pts = nodes.filter((n) => n.pointId);
    return { total: pts.length, mastered: pts.filter((n) => getProgress(state, n.pointId!).status === 'mastered').length };
  }, [state, nodes]);

  const nodeStatus = selected ? getStatus(selected) : 'not-started';
  const isFav = (point && state.favorites.some((f) => f.targetId === point.id && f.targetType === 'knowledge'))
    || (scenario && state.favorites.some((f) => f.targetId === scenario.id && f.targetType === 'scenario'));

  // Zoom/pan handlers
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.85 : 1.15;
    setTransform((t) => ({ ...t, scale: Math.max(0.3, Math.min(3, t.scale * delta)) }));
  };
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.target !== svgRef.current && !(e.target as SVGElement).closest?.('g.graph-node') === undefined) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, tx: transform.x, ty: transform.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    setTransform((t) => ({ ...t, x: dragRef.current!.tx + e.clientX - dragRef.current!.startX, y: dragRef.current!.ty + e.clientY - dragRef.current!.startY }));
  };
  const onPointerUp = () => { dragRef.current = null; };

  const statusColors: Record<NodeStatus, { stroke: string; fill: string }> = {
    'not-started': { stroke: 'var(--line-strong)', fill: 'var(--surface)' },
    'learning': { stroke: 'var(--blue)', fill: 'color-mix(in srgb,var(--blue) 10%,var(--surface))' },
    'mastered': { stroke: 'var(--accent)', fill: 'color-mix(in srgb,var(--accent) 10%,var(--surface))' },
    'review': { stroke: 'var(--amber)', fill: 'color-mix(in srgb,var(--amber) 10%,var(--surface))' },
    'wrong': { stroke: 'var(--danger)', fill: 'color-mix(in srgb,var(--danger) 8%,var(--surface))' },
    'scenario': { stroke: 'var(--blue)', fill: 'var(--surface)' },
  };

  return (
    <div className="graph-layout">
      <Panel className="graph-canvas-panel">
        <div className="graph-toolbar">
          <div>
            <h2>知识图谱</h2>
            <p>点击节点查看详情；滚轮缩放，拖拽平移。</p>
          </div>
          <div className="graph-stats">
            <Tag tone="green">已掌握 {graphStats.mastered}/{graphStats.total}</Tag>
            <button className="icon-button" type="button" onClick={() => setTransform({ x: 0, y: 0, scale: 1 })} title="重置视图"><ZoomIn size={16} /></button>
            <button className="icon-button" type="button" onClick={() => setTransform((t) => ({ ...t, scale: Math.max(0.3, t.scale * 0.8) }))} title="缩小"><ZoomOut size={16} /></button>
          </div>
        </div>

        <svg
          ref={svgRef}
          className="knowledge-svg"
          viewBox="0 0 1200 480"
          style={{ cursor: dragRef.current ? 'grabbing' : 'grab' }}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          role="img"
          aria-label="Java 后端知识图谱"
        >
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="var(--muted)" />
            </marker>
          </defs>
          <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}>
            {edges.map((e) => {
              const a = pos[e.from], b = pos[e.to];
              if (!a || !b) return null;
              return (
                <line key={`${e.from}-${e.to}`}
                  x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  markerEnd="url(#arrow)" className="graph-edge" />
              );
            })}
            {nodes.map((node) => {
              const p = pos[node.id];
              if (!p) return null;
              const status = getStatus(node);
              const isSelected = node.id === selectedId;
              const { stroke, fill } = isSelected
                ? { stroke: 'var(--accent)', fill: 'color-mix(in srgb,var(--accent) 18%,var(--surface))' }
                : statusColors[status];
              const hue = node.moduleId ? moduleHue(node.moduleId) : 200;
              return (
                <g key={node.id} className="graph-node" onClick={() => setSelectedId(node.id)} style={{ cursor: 'pointer' }}>
                  <rect x={p.x - 68} y={p.y - 22} width="136" height="44" rx="8"
                    style={{ fill, stroke, strokeWidth: isSelected ? 2.5 : status === 'scenario' ? 1.5 : 2, strokeDasharray: status === 'scenario' ? '4 2' : undefined }} />
                  {node.moduleId && <rect x={p.x - 68} y={p.y - 22} width="4" height="44" rx="2" style={{ fill: `hsl(${hue},60%,55%)` }} />}
                  <text x={p.x + 2} y={p.y + 5} textAnchor="middle" style={{ fill: 'var(--text)', fontWeight: 700, fontSize: 12, pointerEvents: 'none' }}>
                    {node.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        <div className="graph-legend">
          {(['not-started', 'learning', 'mastered', 'review', 'wrong', 'scenario'] as NodeStatus[]).map((s) => {
            const labels: Record<NodeStatus, string> = { 'not-started': '未开始', learning: '学习中', mastered: '已掌握', review: '需复习', wrong: '有错题', scenario: '场景' };
            return (
              <span className="legend-item" key={s}>
                <i className={`legend-dot dot-${s}`} />
                {labels[s]}
              </span>
            );
          })}
        </div>
      </Panel>

      <Panel className="graph-detail">
        {selected && (
          <>
            <div className="detail-title">
              <div>
                <h2>{point?.title ?? scenario?.title ?? selected.label}</h2>
                <small>{module?.title ?? (scenario ? '场景实战' : '')}</small>
              </div>
              <div className="compact-actions">
                {point && (
                  <button type="button" className="ghost-btn"
                    onClick={() => setState((cur) => upsertProgress(cur, point.id, nodeStatus === 'mastered' ? 'review' : 'mastered'))}>
                    {nodeStatus === 'mastered' ? '标记需复习' : '标记已掌握'}
                  </button>
                )}
                <button type="button" className={`icon-button ${isFav ? 'active' : ''}`}
                  onClick={() => {
                    if (point) setState((cur) => toggleFavorite(cur, point.id, 'knowledge'));
                    if (scenario) setState((cur) => toggleFavorite(cur, scenario.id, 'scenario'));
                  }}>
                  <Bookmark size={17} />
                </button>
              </div>
            </div>

            <div className="graph-node-meta">
              <Tag tone={nodeStatus === 'mastered' ? 'green' : nodeStatus === 'wrong' || nodeStatus === 'review' ? 'hot' : nodeStatus === 'learning' ? 'blue' : 'neutral'}>
                {nodeStatus === 'scenario' ? '场景' : statusLabel[nodeStatus === 'wrong' ? 'review' : nodeStatus as 'not-started' | 'learning' | 'mastered' | 'review']}
              </Tag>
              {module && moduleMastery !== undefined && (
                <span className="graph-module-mastery">
                  模块 {moduleMastery}%
                  <ProgressBar value={moduleMastery} size="sm" />
                </span>
              )}
            </div>

            {point && (
              <>
                <div className="tag-row">{point.tags.slice(0, 5).map((t) => <Tag key={t}>{t}</Tag>)}</div>
                <div className="concept-list compact">
                  {point.coreConcepts.slice(0, 2).map((c) => (
                    <article key={c.title}>
                      <h3>{c.title}</h3>
                      <p><SafeHtml html={c.body} /></p>
                    </article>
                  ))}
                </div>
                {point.pitfalls.length > 0 && (
                  <div className="pitfall-box compact">
                    <strong>常见误区</strong>
                    {point.pitfalls.slice(0, 2).map((p) => <span key={p}>{p}</span>)}
                  </div>
                )}
              </>
            )}

            {scenario && (
              <div className="concept-list compact">
                <article><h3>背景</h3><p>{scenario.background}</p></article>
                <article><h3>分析路径</h3><p>{scenario.analysisPath.join(' → ')}</p></article>
                <article><h3>解决方案</h3><p>{scenario.solution.slice(0, 3).join('；')}</p></article>
              </div>
            )}

            {dependencies.length > 0 && (
              <div className="graph-dependencies">
                <h3><GitBranch size={15} /> 前置依赖</h3>
                <div>
                  {dependencies.map((dep) => (
                    <button type="button" key={dep!.id} onClick={() => setSelectedId(dep!.id)}>{dep!.title}</button>
                  ))}
                </div>
              </div>
            )}

            {relatedQuestions.length > 0 && (
              <div className="related-questions">
                <h3><MessageSquareQuote size={16} /> 关联面试题</h3>
                {relatedQuestions.slice(0, 5).map((q) => (
                  <button type="button" key={q!.id} onClick={() => goTo('interview', q!.title)}>{q!.title}</button>
                ))}
              </div>
            )}

            {point && (nodeStatus === 'not-started' || nodeStatus === 'review' || nodeStatus === 'wrong') && (
              <div className="graph-review-suggestion">
                <RotateCcw size={15} />
                <div>
                  <strong>{nodeStatus === 'wrong' ? '有错题，建议优先复盘' : nodeStatus === 'review' ? '标记为需复习' : '尚未开始学习'}</strong>
                  <button type="button" className="ghost-btn"
                    onClick={() => { setState((cur) => upsertProgress(cur, point.id, 'learning')); goTo('modules', point.title); }}>
                    去学习
                  </button>
                </div>
              </div>
            )}

            <div className="graph-hint"><Star size={16} /> 推荐：先讲依赖关系，再讲底层机制，最后落到项目场景。</div>
          </>
        )}
      </Panel>
    </div>
  );
}
