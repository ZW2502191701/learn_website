import { appData, moduleLookup } from '../data/appData';
import { masteryForModule, correctRateForModule, wrongCountForModule } from '../lib/metrics';
import type { QuestionCategory, UserState } from '../types';

const dateKey = (d: Date) => d.toISOString().slice(0, 10);

export function dailyStats(state: UserState, date: string) {
  const sessions = state.learningSessions.filter((s) => dateKey(new Date(s.startedAt)) === date);
  const studied = sessions.reduce((s, sess) => s + sess.knowledgePointsStudied.length, 0);
  const reviewed = sessions.filter((s) => s.mode === 'review').length;
  const correct = sessions.reduce((s, sess) => s + sess.correctCount, 0);
  const incorrect = sessions.reduce((s, sess) => s + (sess.totalCount - sess.correctCount), 0);
  const duration = sessions.reduce((s, sess) => s + sess.durationSeconds, 0);
  return { studied, reviewed, correct, incorrect, duration };
}

function dateRange(days: number): string[] {
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(dateKey(d));
  }
  return dates;
}

export function weeklyTrend(state: UserState) {
  return dateRange(7).map((date) => {
    const stats = dailyStats(state, date);
    const dayProgress = Object.values(state.progress).filter(
      (p) => p.lastStudiedAt && dateKey(new Date(p.lastStudiedAt)) === date
    );
    const correctRate = stats.correct + stats.incorrect > 0
      ? Math.round((stats.correct / (stats.correct + stats.incorrect)) * 100) : 0;
    return {
      date,
      studied: stats.studied || dayProgress.length,
      reviewed: stats.reviewed,
      correctRate,
      masteryDelta: 0
    };
  });
}

export function monthlyTrend(state: UserState) {
  return dateRange(30).map((date) => {
    const stats = dailyStats(state, date);
    const dayProgress = Object.values(state.progress).filter(
      (p) => p.lastStudiedAt && dateKey(new Date(p.lastStudiedAt)) === date
    );
    const correctRate = stats.correct + stats.incorrect > 0
      ? Math.round((stats.correct / (stats.correct + stats.incorrect)) * 100) : 0;
    return {
      date,
      studied: stats.studied || dayProgress.length,
      reviewed: stats.reviewed,
      correctRate,
      masteryDelta: 0
    };
  });
}

export function moduleBreakdown(state: UserState) {
  return appData.modules.map((mod) => ({
    moduleId: mod.id,
    title: mod.title,
    mastery: masteryForModule(state, mod.id),
    correctRate: correctRateForModule(state, mod.id),
    questionCount: appData.questions.filter((q) => q.moduleId === mod.id).length,
    wrongCount: wrongCountForModule(state, mod.id)
  }));
}

export function errorTrendByCategory(state: UserState): Record<string, number> {
  const categories: QuestionCategory[] = ['基础题', '源码题', '场景题', '八股题', '项目题', '系统设计题', 'HR面'];
  const result: Record<string, number> = {};
  for (const cat of categories) {
    result[cat] = state.wrongQuestions.filter((w) => {
      const q = appData.questions.find((q) => q.id === w.questionId);
      return q?.category === cat;
    }).length;
  }
  return result;
}

export function streakStats(state: UserState) {
  const sorted = [...state.checkins].sort();
  if (!sorted.length) return { current: 0, longest: 0, total: 0, thisWeek: 0 };

  let current = 1;
  let longest = 1;
  for (let i = sorted.length - 1; i > 0; i--) {
    const curr = new Date(sorted[i]);
    const prev = new Date(sorted[i - 1]);
    const diff = (curr.getTime() - prev.getTime()) / 86_400_000;
    if (Math.abs(diff - 1) < 0.1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  const today = dateKey(new Date());
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeek = sorted.filter((d) => d >= dateKey(weekAgo) && d <= today).length;

  const lastCheckin = sorted[sorted.length - 1];
  const daysSinceLast = (Date.now() - new Date(lastCheckin).getTime()) / 86_400_000;
  if (daysSinceLast > 1.5) current = 0;

  return { current, longest, total: sorted.length, thisWeek };
}
