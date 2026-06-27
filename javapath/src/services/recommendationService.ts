import { appData, moduleLookup, pointsByModule } from '../data/appData';
import { getProgress, masteryForModule, overallMastery } from '../lib/metrics';
import { masteryScore, forgetRisk } from './masteryService';
import { getDueReviews } from './reviewService';
import type { KnowledgePoint, Module, UserState } from '../types';

export function todaysTasks(state: UserState) {
  const weak = weakKnowledgePoints(state, 3);
  const studies = weak.map((w) => w.point);
  const reviews = getDueReviews(state, 5);
  const interviews: string[] = [];
  if (state.wrongQuestions.length > 0) interviews.push('error-review');
  if (studies.length > 0) interviews.push('weak-spot');
  interviews.push('quick-drill');
  return { studies, reviews, interviews };
}

export function weakKnowledgePoints(
  state: UserState,
  limit = 5
): Array<{ point: KnowledgePoint; module: Module; forgetRisk: number; masteryScore: number }> {
  return appData.knowledgePoints
    .map((kp) => {
      const module = moduleLookup.get(kp.moduleId)!;
      const ms = masteryScore(state, kp.id);
      const fr = forgetRisk(state, kp.id);
      return { point: kp, module, masteryScore: ms, forgetRisk: fr };
    })
    .sort((a, b) => {
      const aRisk = a.masteryScore < 70 ? a.forgetRisk : 0;
      const bRisk = b.masteryScore < 70 ? b.forgetRisk : 0;
      return bRisk - aRisk || a.masteryScore - b.masteryScore;
    })
    .slice(0, limit);
}

export function recommendedQuestions(
  state: UserState,
  limit = 5
): Array<{ question: typeof appData.questions[0]; module: Module; reason: string }> {
  const scored = appData.questions.map((q) => {
    const module = moduleLookup.get(q.moduleId)!;
    const isWrong = state.wrongQuestions.some((w) => w.questionId === q.id);
    const kpProgress = q.knowledgePointId ? getProgress(state, q.knowledgePointId) : null;
    const correctRate = kpProgress && kpProgress.attempts > 0 ? kpProgress.correct / kpProgress.attempts : -1;
    const moduleMastery = masteryForModule(state, q.moduleId);

    let score = 0;
    let reason = '推荐练习';

    if (isWrong) {
      score += 50;
      reason = '错题待巩固';
    } else if (correctRate >= 0 && correctRate < 0.5) {
      score += 35;
      reason = '正确率偏低';
    } else if (correctRate < 0) {
      score += 25;
      reason = '尚未练习';
    }

    if (moduleMastery < 40) {
      score += 20;
      reason = '模块薄弱';
    }

    score += q.frequency / 10;

    return { question: q, module, score, reason };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function interviewReadinessScore(state: UserState): { score: number; breakdown: Record<string, number> } {
  const mastery = overallMastery(state);
  const totalAttempts = Object.values(state.progress).reduce((s, p) => s + p.attempts, 0);
  const totalCorrect = Object.values(state.progress).reduce((s, p) => s + p.correct, 0);
  const correctRate = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
  const coverage = Math.round(
    (Object.values(state.progress).filter((p) => p.status !== 'not-started').length /
      Math.max(1, appData.knowledgePoints.length)) * 100
  );
  const wrongResolved = state.wrongQuestions.filter((w) => w.note && w.note.trim().length > 0).length;
  const reviewCompliance = state.wrongQuestions.length > 0
    ? Math.round((wrongResolved / state.wrongQuestions.length) * 100)
    : 100;

  const score = Math.round(mastery * 0.4 + correctRate * 0.3 + coverage * 0.2 + reviewCompliance * 0.1);

  return {
    score,
    breakdown: { 掌握度: mastery, 正确率: correctRate, 知识覆盖率: coverage, 复盘完成率: reviewCompliance }
  };
}
