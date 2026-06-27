// ── Local API Client ────────────────────────────────────────────────
// Implements ApiClient using localStorage + in-memory appData.
// This is the default implementation — no network calls, everything
// runs locally in the browser.

import type { ApiClient } from './client';
import type { AppData, UserState, InterviewSession, InterviewMode, MasteryRecord, ReviewScheduleItem } from '../types';
import type {
  ApiResponse, DashboardSummary, DueReviewItem, ModuleAnalytics, TrendDataPoint,
  StartSessionRequest, StartSessionResponse, SubmitAnswerRequest, SubmitAnswerResponse,
  CompleteSessionResponse, ReviewScoreRequest, ReviewScoreResponse, SearchRequest, SearchResponse
} from './types';
import { appData, moduleLookup } from '../data/appData';
import { loadState, saveState, exportState, importState, resetStateWithBackup } from '../lib/storage';
import { createSession, answerQuestion, completeSession, generateQuestionsForMode } from '../services/interviewService';
import { scheduleReview, getDueReviews, buildReviewQueue } from '../services/reviewService';
import { overallMastery, masteryForModule, correctRateForModule, wrongCountForModule } from '../lib/metrics';
import { interviewReadinessScore, todaysTasks, weakKnowledgePoints } from '../services/recommendationService';
import { searchAllWithState } from '../lib/search';
import { weeklyTrend, monthlyTrend, moduleBreakdown, streakStats } from '../services/analyticsService';
import { masteryScore, snapshotMastery } from '../services/masteryService';

const ok = <T>(data: T): ApiResponse<T> => ({
  data,
  success: true,
  timestamp: new Date().toISOString()
});

const err = <T>(message: string): ApiResponse<T> => ({
  data: null as unknown as T,
  success: false,
  message,
  timestamp: new Date().toISOString()
});

export class LocalClient implements ApiClient {
  private state: UserState;

  constructor() {
    this.state = loadState();
  }

  private getState(): UserState {
    return this.state;
  }

  private setState(state: UserState): void {
    this.state = state;
    saveState(state);
  }

  // ── Content ──────────────────────────────────────────────────────

  async getAppData(): Promise<ApiResponse<AppData>> {
    return ok(appData);
  }

  // ── User State ───────────────────────────────────────────────────

  async getUserState(): Promise<ApiResponse<UserState>> {
    return ok(this.getState());
  }

  async saveUserState(state: UserState): Promise<ApiResponse<void>> {
    this.setState(state);
    return ok(undefined);
  }

  async exportUserState(): Promise<ApiResponse<string>> {
    return ok(exportState(this.getState()));
  }

  async importUserState(data: string): Promise<ApiResponse<UserState>> {
    try {
      const state = importState(data);
      this.setState(state);
      return ok(state);
    } catch (e) {
      return err((e as Error).message);
    }
  }

  async resetUserState(): Promise<ApiResponse<UserState>> {
    const state = resetStateWithBackup(this.getState());
    this.setState(state);
    return ok(state);
  }

  // ── Interview ────────────────────────────────────────────────────

  async startSession(req: StartSessionRequest): Promise<ApiResponse<StartSessionResponse>> {
    const questionIds = generateQuestionsForMode(req.mode, this.getState(), req.questionCount ?? 8);
    if (!questionIds.length) return err('该模式暂无可用题目');
    const session = createSession(req.mode, questionIds);
    const questions = questionIds
      .map((id) => appData.questions.find((q) => q.id === id))
      .filter((q): q is NonNullable<typeof q> => !!q);
    return ok({ session, questions });
  }

  async submitAnswer(sessionId: string, req: SubmitAnswerRequest): Promise<ApiResponse<SubmitAnswerResponse>> {
    const sessions = this.getState().interviewSessions;
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return err('会话不存在');
    const updated = answerQuestion(session, req.questionId, req.userAnswer, req.duration, req.selfScore);
    const question = appData.questions.find((q) => q.id === req.questionId);
    const keyPoints = question?.points ?? [];
    const keyPointsCovered = keyPoints.filter((p) =>
      req.userAnswer.toLowerCase().includes(p.slice(0, 10).toLowerCase())
    );
    const keyPointsMissed = keyPoints.filter((p) =>
      !req.userAnswer.toLowerCase().includes(p.slice(0, 10).toLowerCase())
    );
    return ok({
      session: updated,
      feedback: {
        score: Math.round((req.selfScore / 5) * 100),
        keyPointsCovered,
        keyPointsMissed,
        suggestion: keyPointsMissed.length > 0
          ? `遗漏了 ${keyPointsMissed.length} 个要点：${keyPointsMissed[0]}`
          : '回答覆盖了所有要点，很好！'
      }
    });
  }

  async completeSession(sessionId: string): Promise<ApiResponse<CompleteSessionResponse>> {
    const sessions = this.getState().interviewSessions;
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return err('会话不存在');
    const { session: completed, report } = completeSession(session);
    const prev = this.getState();
    const updatedState: UserState = {
      ...prev,
      interviewSessions: prev.interviewSessions.map((s) => s.id === sessionId ? completed : s)
    };
    this.setState(updatedState);
    return ok({ session: completed, report });
  }

  async getSessionHistory(limit = 20): Promise<ApiResponse<InterviewSession[]>> {
    const sessions = this.getState().interviewSessions.slice(-limit).reverse();
    return ok(sessions);
  }

  // ── Review ───────────────────────────────────────────────────────

  async getDueReviews(limit = 20): Promise<ApiResponse<DueReviewItem[]>> {
    const queue = buildReviewQueue(this.getState(), limit);
    return ok(queue.map((item) => ({
      questionId: item.questionId,
      questionTitle: item.questionTitle,
      moduleId: item.moduleId,
      moduleTitle: item.moduleTitle,
      easeFactor: item.easeFactor,
      intervalDays: item.intervalDays,
      daysOverdue: item.daysOverdue
    })));
  }

  async submitReviewScore(req: ReviewScoreRequest): Promise<ApiResponse<ReviewScoreResponse>> {
    const updated = scheduleReview(this.getState(), req.questionId, req.quality);
    this.setState(updated);
    const item = updated.reviewSchedule.find((r) => r.questionId === req.questionId);
    return ok({
      item: item!,
      nextReviewAt: item?.nextReviewAt ?? new Date().toISOString()
    });
  }

  async getReviewSchedule(): Promise<ApiResponse<ReviewScheduleItem[]>> {
    return ok(this.getState().reviewSchedule);
  }

  // ── Search ───────────────────────────────────────────────────────

  async search(req: SearchRequest): Promise<ApiResponse<SearchResponse>> {
    const results = searchAllWithState(req.query, this.getState());
    const filtered = req.types?.length
      ? results.filter((r) => req.types!.includes(r.type))
      : results;
    const limited = filtered.slice(0, req.limit ?? 50);
    return ok({ results: limited, total: filtered.length, query: req.query });
  }

  // ── Analytics ────────────────────────────────────────────────────

  async getDashboardSummary(): Promise<ApiResponse<DashboardSummary>> {
    const state = this.getState();
    const readiness = interviewReadinessScore(state);
    const tasks = todaysTasks(state);
    const streaks = streakStats(state);
    return ok({
      overallMastery: overallMastery(state),
      interviewReadiness: readiness.score,
      daysUntilTarget: Math.max(0, Math.ceil((new Date(state.targetDate).getTime() - Date.now()) / 86_400_000)),
      dueReviewCount: getDueReviews(state).length,
      wrongQuestionCount: state.wrongQuestions.length,
      streak: streaks.current,
      todayTasks: {
        studies: tasks.studies.map((s) => s.id),
        reviews: tasks.reviews.map((r) => r.questionId),
        interviewModes: tasks.interviews
      }
    });
  }

  async getWeeklyTrend(): Promise<ApiResponse<TrendDataPoint[]>> {
    return ok(weeklyTrend(this.getState()));
  }

  async getMonthlyTrend(): Promise<ApiResponse<TrendDataPoint[]>> {
    return ok(monthlyTrend(this.getState()));
  }

  async getModuleBreakdown(): Promise<ApiResponse<ModuleAnalytics[]>> {
    return ok(moduleBreakdown(this.getState()));
  }

  async getMasteryHistory(): Promise<ApiResponse<MasteryRecord[]>> {
    return ok(snapshotMastery(this.getState()));
  }
}
