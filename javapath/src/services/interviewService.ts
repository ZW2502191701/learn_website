import { appData, questionLookup } from '../data/appData';
import { weakModules } from '../lib/metrics';
import type { InterviewMode, InterviewReport, InterviewSession, UserState } from '../types';

export function createSession(mode: InterviewMode, questionIds: string[]): InterviewSession {
  return {
    id: crypto.randomUUID(),
    mode,
    startedAt: new Date().toISOString(),
    questionIds,
    answers: []
  };
}

export function answerQuestion(
  session: InterviewSession,
  questionId: string,
  userAnswer: string,
  duration: number,
  selfScore: number
): InterviewSession {
  const existing = session.answers.findIndex((a) => a.questionId === questionId);
  const answer = { questionId, userAnswer, duration, selfScore };
  const answers = [...session.answers];
  if (existing >= 0) {
    answers[existing] = answer;
  } else {
    answers.push(answer);
  }
  return { ...session, answers };
}

export function completeSession(
  session: InterviewSession,
  dimensionScores?: Record<string, number>
): { session: InterviewSession; report: InterviewReport } {
  const endedAt = new Date().toISOString();
  const totalSelfScore = session.answers.reduce((s, a) => s + a.selfScore, 0);
  const answeredCount = session.answers.length;
  const avgScore = answeredCount > 0 ? Math.round((totalSelfScore / (answeredCount * 5)) * 100) : 0;

  const defaultDimensions: Record<string, number> = {
    准确性: 0,
    完整性: 0,
    深度: 0,
    表达清晰度: 0,
    场景结合: 0,
    抗追问能力: 0
  };

  const dims = dimensionScores ?? {};
  for (const key of Object.keys(defaultDimensions)) {
    if (dims[key] === undefined) {
      dims[key] = avgScore;
    }
  }

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  for (const [dim, score] of Object.entries(dims)) {
    if (score >= 70) strengths.push(dim);
    else if (score < 50) weaknesses.push(dim);
  }

  const suggestions: string[] = [];
  if (weaknesses.includes('准确性')) suggestions.push('建议回顾核心概念，确保定义和原理准确。');
  if (weaknesses.includes('深度')) suggestions.push('建议深入理解底层原理，而不只停留在表面。');
  if (weaknesses.includes('表达清晰度')) suggestions.push('建议练习用 STAR 结构组织回答。');
  if (weaknesses.includes('场景结合')) suggestions.push('建议结合真实项目场景来表达技术方案。');
  if (weaknesses.includes('抗追问能力')) suggestions.push('建议准备每个知识点的 3 层追问链路。');
  if (suggestions.length === 0) suggestions.push('表现不错，继续保持！可以尝试更高难度的模式。');

  const completedSession: InterviewSession = {
    ...session,
    endedAt,
    overallScore: avgScore,
    dimensionScores: dims,
    summary: `共 ${session.questionIds.length} 题，回答 ${answeredCount} 题，平均分 ${avgScore}`
  };

  const report: InterviewReport = {
    sessionId: session.id,
    totalQuestions: session.questionIds.length,
    answeredQuestions: answeredCount,
    averageScore: avgScore,
    dimensionScores: dims,
    strengths,
    weaknesses,
    suggestions,
    completedAt: endedAt
  };

  return { session: completedSession, report };
}

const shuffle = <T>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export function generateQuestionsForMode(mode: InterviewMode, state: UserState, limit = 8): string[] {
  const all = appData.questions;

  switch (mode) {
    case 'first-round':
      return shuffle(all.filter((q) => ['基础题', '八股题'].includes(q.category))).slice(0, limit).map((q) => q.id);

    case 'second-round':
      return shuffle(all.filter((q) => ['场景题', '系统设计题', '源码题'].includes(q.category))).slice(0, limit).map((q) => q.id);

    case 'hr':
      return shuffle(all.filter((q) => q.category === 'HR面')).slice(0, Math.min(limit, 5)).map((q) => q.id);

    case 'big-tech-pressure':
      return shuffle(all.filter((q) => q.difficulty >= 4)).slice(0, limit).map((q) => q.id);

    case 'quick-drill':
      return shuffle(all).slice(0, Math.min(limit, 5)).map((q) => q.id);

    case 'error-review':
      return shuffle(state.wrongQuestions.map((w) => w.questionId).filter((id) => questionLookup.has(id)))
        .slice(0, limit);

    case 'weak-spot': {
      const weak = weakModules(state);
      const weakModuleIds = new Set(weak.map((w) => w.module.id));
      return shuffle(all.filter((q) => weakModuleIds.has(q.moduleId))).slice(0, limit).map((q) => q.id);
    }

    default:
      return shuffle(all).slice(0, limit).map((q) => q.id);
  }
}

export function scoreDimension(session: InterviewSession, dimension: string): number {
  if (!session.answers.length) return 0;
  const avgSelf = session.answers.reduce((s, a) => s + a.selfScore, 0) / session.answers.length;
  const base = Math.round((avgSelf / 5) * 100);
  const jitter = ((dimension.charCodeAt(0) % 10) - 5) * 3;
  return Math.max(0, Math.min(100, base + jitter));
}
