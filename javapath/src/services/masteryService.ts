import { pointsByModule, moduleLookup } from '../data/appData';
import type { MasteryRecord, UserState } from '../types';
import { getProgress } from '../lib/metrics';

const STATUS_WEIGHT: Record<string, number> = {
  'not-started': 0,
  learning: 0.5,
  review: 0.35,
  mastered: 1
};

export function masteryScore(state: UserState, knowledgePointId: string): number {
  const progress = getProgress(state, knowledgePointId);
  const statusW = STATUS_WEIGHT[progress.status] ?? 0;
  const correctRatio = progress.attempts > 0 ? progress.correct / progress.attempts : 0;
  let recencyBonus = 0;
  if (progress.lastStudiedAt) {
    const daysSince = (Date.now() - new Date(progress.lastStudiedAt).getTime()) / 86_400_000;
    recencyBonus = daysSince < 1 ? 1 : daysSince < 3 ? 0.7 : daysSince < 7 ? 0.4 : 0.1;
  }
  return Math.round(statusW * 60 + correctRatio * 25 + recencyBonus * 15);
}

export function masteryLevel(score: number): MasteryRecord['level'] {
  if (score >= 90) return 'expert';
  if (score >= 70) return 'mastered';
  if (score >= 45) return 'familiar';
  if (score >= 20) return 'beginner';
  return 'unknown';
}

export function forgetRisk(state: UserState, knowledgePointId: string): number {
  const progress = getProgress(state, knowledgePointId);
  if (progress.status === 'not-started') return 0;
  if (!progress.lastStudiedAt) return 80;
  const daysSince = (Date.now() - new Date(progress.lastStudiedAt).getTime()) / 86_400_000;
  const mastery = masteryScore(state, knowledgePointId);
  const reviewItem = state.reviewSchedule.find((r) => r.knowledgePointId === knowledgePointId);
  const intervalDays = reviewItem?.intervalDays ?? 7;
  const overdue = daysSince - intervalDays;
  let risk = 0;
  if (overdue > 0) risk += Math.min(50, overdue * 8);
  if (mastery < 40) risk += 30;
  else if (mastery < 60) risk += 15;
  if (progress.attempts > 0 && progress.correct / progress.attempts < 0.5) risk += 20;
  return Math.min(100, Math.round(risk));
}

export function snapshotMastery(state: UserState): MasteryRecord[] {
  const now = new Date().toISOString();
  return Array.from(pointsByModule.entries()).flatMap(([, points]) =>
    points.map((kp) => {
      const score = masteryScore(state, kp.id);
      return {
        knowledgePointId: kp.id,
        score,
        level: masteryLevel(score),
        forgetRisk: forgetRisk(state, kp.id),
        lastReviewedAt: getProgress(state, kp.id).lastStudiedAt,
        recordedAt: now
      };
    })
  );
}

export function moduleMasteryEnhanced(state: UserState, moduleId: string) {
  const points = pointsByModule.get(moduleId) ?? [];
  if (!points.length) return { score: 0, level: 'unknown' as const, forgetRisk: 0, pointCount: 0, masteredCount: 0 };
  let totalScore = 0;
  let totalRisk = 0;
  let masteredCount = 0;
  for (const kp of points) {
    const s = masteryScore(state, kp.id);
    totalScore += s;
    totalRisk += forgetRisk(state, kp.id);
    if (s >= 70) masteredCount++;
  }
  const avgScore = Math.round(totalScore / points.length);
  return {
    score: avgScore,
    level: masteryLevel(avgScore),
    forgetRisk: Math.round(totalRisk / points.length),
    pointCount: points.length,
    masteredCount
  };
}
