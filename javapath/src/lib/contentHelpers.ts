import type { KnowledgePoint, InterviewQuestion, Scenario } from '../types';
import { appData, scenarioLookup } from '../data/appData';

export function buildInterviewVersion(kp: KnowledgePoint): string {
  const points = kp.coreConcepts.slice(0, 4).map((c, i) => `${i + 1}. ${c.title}: ${stripHtml(c.body).slice(0, 80)}`);
  const pitfalls = kp.pitfalls.length > 0 ? `\n易错点: ${kp.pitfalls[0]}` : '';
  return points.join('\n') + pitfalls;
}

export function buildFollowUpChain(
  kp: KnowledgePoint,
  questions: InterviewQuestion[] = appData.questions
): Array<{ question: InterviewQuestion; followUps: string[] }> {
  return questions
    .filter((q) => q.knowledgePointId === kp.id)
    .slice(0, 3)
    .map((q) => ({ question: q, followUps: q.followUps }));
}

export function findRelatedScenarios(kp: KnowledgePoint): Scenario[] {
  return appData.scenarios.filter(
    (s) => s.moduleIds.includes(kp.moduleId) || s.tags.some((t) => kp.tags.includes(t))
  );
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}
