import { appData, moduleLookup, pointsByModule } from '../data/appData';
import type { ProgressStatus, StudyProgress, UserState } from '../types';

export const statusLabel: Record<ProgressStatus, string> = {
  'not-started': '未开始',
  learning: '学习中',
  mastered: '已掌握',
  review: '需复习'
};

export const statusOrder: ProgressStatus[] = ['not-started', 'learning', 'mastered', 'review'];

export const getProgress = (state: UserState, knowledgePointId: string): StudyProgress => {
  return (
    state.progress[knowledgePointId] ?? {
      knowledgePointId,
      status: 'not-started',
      correct: 0,
      attempts: 0
    }
  );
};

export const masteryForModule = (state: UserState, moduleId: string) => {
  const points = pointsByModule.get(moduleId) ?? [];
  if (!points.length) return 0;
  const score = points.reduce((sum, point) => {
    const status = getProgress(state, point.id).status;
    if (status === 'mastered') return sum + 1;
    if (status === 'learning') return sum + 0.55;
    if (status === 'review') return sum + 0.35;
    return sum;
  }, 0);
  return Math.round((score / points.length) * 100);
};

export const overallMastery = (state: UserState) => {
  if (!appData.knowledgePoints.length || !appData.modules.length) return 0;
  const total = appData.modules.reduce((sum, module) => sum + masteryForModule(state, module.id), 0);
  return Number.isFinite(total) ? Math.round(total / appData.modules.length) : 0;
};

export const weakModules = (state: UserState) => {
  return appData.modules
    .map((module) => ({ module, mastery: masteryForModule(state, module.id), wrong: wrongCountForModule(state, module.id) }))
    .sort((a, b) => a.mastery - b.mastery || b.wrong - a.wrong)
    .slice(0, 4);
};

export const wrongCountForModule = (state: UserState, moduleId: string) =>
  state.wrongQuestions.filter((item) => item.moduleId === moduleId).length;

export const correctRateForModule = (state: UserState, moduleId: string) => {
  const points = pointsByModule.get(moduleId) ?? [];
  const totals = points.reduce(
    (acc, point) => {
      const progress = getProgress(state, point.id);
      return { attempts: acc.attempts + progress.attempts, correct: acc.correct + progress.correct };
    },
    { attempts: 0, correct: 0 }
  );
  if (!totals.attempts) return Math.max(48, masteryForModule(state, moduleId) - 8);
  return Math.round((totals.correct / totals.attempts) * 100);
};

export const recommendedPoints = (state: UserState, limit = 6) => {
  const scored = appData.knowledgePoints.flatMap((point) => {
    const module = moduleLookup.get(point.moduleId);
    if (!module) return [];
    const progress = getProgress(state, point.id);
    const statusPenalty = progress.status === 'not-started' ? 30 : progress.status === 'review' ? 45 : progress.status === 'learning' ? 20 : 0;
    const wrongBoost = state.wrongQuestions.some((wrong) => wrong.questionId.startsWith(point.id)) ? 28 : 0;
    return {
      point,
      module,
      score: module.importance + point.difficulty * 8 + statusPenalty + wrongBoost
    };
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
};

export const daysUntil = (targetDate: string) => {
  const now = new Date();
  const target = new Date(`${targetDate}T23:59:59`);
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86_400_000));
};

export const recentStudy = (state: UserState) => {
  return Object.values(state.progress)
    .filter((item) => item.lastStudiedAt)
    .sort((a, b) => String(b.lastStudiedAt).localeCompare(String(a.lastStudiedAt)))
    .slice(0, 6);
};
