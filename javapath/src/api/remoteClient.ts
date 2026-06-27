// ── Remote API Client ───────────────────────────────────────────────
// Stub for the future Spring Boot REST API.
// When the backend is ready, set VITE_API_BASE_URL and switch to this client.
// All methods will call the corresponding REST endpoints.
//
// Spring Boot controller mapping (reference):
//   GET    /api/v1/content/modules
//   GET    /api/v1/state
//   PUT    /api/v1/state
//   POST   /api/v1/interview/sessions
//   POST   /api/v1/interview/sessions/{id}/answer
//   POST   /api/v1/interview/sessions/{id}/complete
//   GET    /api/v1/review/due
//   POST   /api/v1/review/score
//   GET    /api/v1/search?q=...
//   GET    /api/v1/analytics/dashboard
//   GET    /api/v1/analytics/trends/weekly
//   GET    /api/v1/analytics/trends/monthly
//   GET    /api/v1/analytics/modules

import type { ApiClient } from './client';
import type {
  ApiResponse, DashboardSummary, DueReviewItem, ModuleAnalytics, TrendDataPoint,
  StartSessionRequest, StartSessionResponse, SubmitAnswerRequest, SubmitAnswerResponse,
  CompleteSessionResponse, ReviewScoreRequest, ReviewScoreResponse, SearchRequest, SearchResponse
} from './types';
import type { AppData, UserState, InterviewSession, ReviewScheduleItem, MasteryRecord } from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1';

async function request<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      ...options
    });
    if (!res.ok) {
      const body = await res.text();
      return { data: null as unknown as T, success: false, message: `HTTP ${res.status}: ${body}`, timestamp: new Date().toISOString() };
    }
    return await res.json() as ApiResponse<T>;
  } catch (e) {
    return { data: null as unknown as T, success: false, message: (e as Error).message, timestamp: new Date().toISOString() };
  }
}

export class RemoteClient implements ApiClient {
  async getAppData() { return request<AppData>('/content'); }
  async getUserState() { return request<UserState>('/state'); }
  async saveUserState(state: UserState) { return request<void>('/state', { method: 'PUT', body: JSON.stringify(state) }); }
  async exportUserState() { return request<string>('/state/export'); }
  async importUserState(data: string) { return request<UserState>('/state/import', { method: 'POST', body: data }); }
  async resetUserState() { return request<UserState>('/state/reset', { method: 'POST' }); }

  async startSession(req: StartSessionRequest) {
    return request<StartSessionResponse>('/interview/sessions', { method: 'POST', body: JSON.stringify(req) });
  }
  async submitAnswer(sessionId: string, req: SubmitAnswerRequest) {
    return request<SubmitAnswerResponse>(`/interview/sessions/${sessionId}/answer`, { method: 'POST', body: JSON.stringify(req) });
  }
  async completeSession(sessionId: string) {
    return request<CompleteSessionResponse>(`/interview/sessions/${sessionId}/complete`, { method: 'POST' });
  }
  async getSessionHistory(limit = 20) {
    return request<InterviewSession[]>(`/interview/sessions?limit=${limit}`);
  }

  async getDueReviews(limit = 20) { return request<DueReviewItem[]>(`/review/due?limit=${limit}`); }
  async submitReviewScore(req: ReviewScoreRequest) {
    return request<ReviewScoreResponse>('/review/score', { method: 'POST', body: JSON.stringify(req) });
  }
  async getReviewSchedule() { return request<ReviewScheduleItem[]>('/review/schedule'); }

  async search(req: SearchRequest) {
    const params = new URLSearchParams({ q: req.query });
    if (req.types?.length) params.set('types', req.types.join(','));
    if (req.moduleId) params.set('moduleId', req.moduleId);
    if (req.limit) params.set('limit', String(req.limit));
    return request<SearchResponse>(`/search?${params}`);
  }

  async getDashboardSummary() { return request<DashboardSummary>('/analytics/dashboard'); }
  async getWeeklyTrend() { return request<TrendDataPoint[]>('/analytics/trends/weekly'); }
  async getMonthlyTrend() { return request<TrendDataPoint[]>('/analytics/trends/monthly'); }
  async getModuleBreakdown() { return request<ModuleAnalytics[]>('/analytics/modules'); }
  async getMasteryHistory() { return request<MasteryRecord[]>('/analytics/mastery'); }
}
