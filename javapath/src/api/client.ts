// ── API Client Interface ────────────────────────────────────────────
// This interface defines all backend operations. Implementations:
//   - LocalClient: backed by localStorage + in-memory data (current)
//   - RemoteClient: backed by Spring Boot REST API (future)
//
// The app starts with LocalClient; switching to RemoteClient requires
// only changing the factory in index.ts — no route/component changes.

import type {
  AppData,
  UserState,
  InterviewSession,
  InterviewReport,
  InterviewMode,
  InterviewQuestion,
  ReviewScheduleItem,
  MasteryRecord
} from '../types';
import type { SearchResult } from '../lib/search';
import type {
  ApiResponse,
  DashboardSummary,
  DueReviewItem,
  ModuleAnalytics,
  TrendDataPoint,
  StartSessionRequest,
  StartSessionResponse,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  CompleteSessionResponse,
  ReviewScoreRequest,
  ReviewScoreResponse,
  SearchRequest,
  SearchResponse
} from './types';

export interface ApiClient {
  // ── Content ──────────────────────────────────────────────────────
  getAppData(): Promise<ApiResponse<AppData>>;

  // ── User State ───────────────────────────────────────────────────
  getUserState(): Promise<ApiResponse<UserState>>;
  saveUserState(state: UserState): Promise<ApiResponse<void>>;
  exportUserState(): Promise<ApiResponse<string>>;
  importUserState(data: string): Promise<ApiResponse<UserState>>;
  resetUserState(): Promise<ApiResponse<UserState>>;

  // ── Interview ────────────────────────────────────────────────────
  startSession(req: StartSessionRequest): Promise<ApiResponse<StartSessionResponse>>;
  submitAnswer(sessionId: string, req: SubmitAnswerRequest): Promise<ApiResponse<SubmitAnswerResponse>>;
  completeSession(sessionId: string): Promise<ApiResponse<CompleteSessionResponse>>;
  getSessionHistory(limit?: number): Promise<ApiResponse<InterviewSession[]>>;

  // ── Review ───────────────────────────────────────────────────────
  getDueReviews(limit?: number): Promise<ApiResponse<DueReviewItem[]>>;
  submitReviewScore(req: ReviewScoreRequest): Promise<ApiResponse<ReviewScoreResponse>>;
  getReviewSchedule(): Promise<ApiResponse<ReviewScheduleItem[]>>;

  // ── Search ───────────────────────────────────────────────────────
  search(req: SearchRequest): Promise<ApiResponse<SearchResponse>>;

  // ── Analytics ────────────────────────────────────────────────────
  getDashboardSummary(): Promise<ApiResponse<DashboardSummary>>;
  getWeeklyTrend(): Promise<ApiResponse<TrendDataPoint[]>>;
  getMonthlyTrend(): Promise<ApiResponse<TrendDataPoint[]>>;
  getModuleBreakdown(): Promise<ApiResponse<ModuleAnalytics[]>>;
  getMasteryHistory(): Promise<ApiResponse<MasteryRecord[]>>;
}
