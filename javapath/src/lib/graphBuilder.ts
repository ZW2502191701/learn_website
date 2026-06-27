import { appData, pointsByModule } from '../data/appData';
import { masteryScore } from '../services/masteryService';
import type { KnowledgeGraphNode, KnowledgeGraphEdge, UserState } from '../types';

const tagSimilarity = (tagsA: string[], tagsB: string[]): boolean => {
  const setA = new Set(tagsA);
  return tagsB.some((t) => setA.has(t));
};

export function buildGraph(state: UserState): { nodes: KnowledgeGraphNode[]; edges: KnowledgeGraphEdge[] } {
  const nodes: KnowledgeGraphNode[] = [];
  const edges: KnowledgeGraphEdge[] = [];
  const seen = new Set<string>();

  for (const kp of appData.knowledgePoints) {
    if (seen.has(kp.id)) continue;
    seen.add(kp.id);
    const score = masteryScore(state, kp.id);
    nodes.push({ id: kp.id, kind: 'knowledge', title: kp.title, moduleId: kp.moduleId, mastery: score });

    for (const depId of kp.dependencies) {
      edges.push({ from: depId, to: kp.id, kind: 'prerequisite', label: '前置知识' });
    }
  }

  for (const q of appData.questions.filter((q) => q.frequency >= 80).slice(0, 30)) {
    const qNode: KnowledgeGraphNode = { id: q.id, kind: 'question', title: q.title, moduleId: q.moduleId };
    nodes.push(qNode);
    if (q.knowledgePointId) {
      edges.push({ from: q.knowledgePointId, to: q.id, kind: 'interview-follow-up', label: '面试题' });
    }
  }

  for (const s of appData.scenarios) {
    const sNode: KnowledgeGraphNode = { id: s.id, kind: 'scenario', title: s.title, moduleId: s.moduleIds[0] ?? '' };
    nodes.push(sNode);
    for (const mid of s.moduleIds) {
      const modulePoints = pointsByModule.get(mid) ?? [];
      if (modulePoints[0]) {
        edges.push({ from: modulePoints[0].id, to: s.id, kind: 'project-relation', label: '场景关联' });
      }
    }
  }

  const knowledgeNodes = nodes.filter((n) => n.kind === 'knowledge');
  for (let i = 0; i < knowledgeNodes.length; i++) {
    for (let j = i + 1; j < knowledgeNodes.length; j++) {
      const a = knowledgeNodes[i];
      const b = knowledgeNodes[j];
      const kpA = appData.knowledgePoints.find((k) => k.id === a.id);
      const kpB = appData.knowledgePoints.find((k) => k.id === b.id);
      if (kpA && kpB && kpA.group === kpB.group && tagSimilarity(kpA.tags, kpB.tags)) {
        edges.push({ from: a.id, to: b.id, kind: 'similar', label: '相似知识' });
      }
    }
  }

  return { nodes, edges };
}

export function masteryColor(score: number): string {
  if (score >= 70) return 'var(--success)';
  if (score >= 40) return 'var(--warning)';
  return 'var(--danger)';
}
