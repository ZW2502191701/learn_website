// ── API Client Factory ──────────────────────────────────────────────
// Usage:
//   import { apiClient } from '../api';
//   const { data } = await apiClient.getDashboardSummary();
//
// Switch to remote backend by setting VITE_API_BASE_URL and changing
// createApiClient() to return new RemoteClient().

export type { ApiClient } from './client';
export type {
  ApiResponse, PaginatedResponse,
  DashboardSummary, TrendDataPoint, ModuleAnalytics,
  StartSessionRequest, StartSessionResponse,
  SubmitAnswerRequest, SubmitAnswerResponse,
  CompleteSessionResponse,
  ReviewScoreRequest, ReviewScoreResponse,
  DueReviewItem,
  SearchRequest, SearchResponse,
  ContentPublishStatus, ParsedPdfMetadata, DraftKnowledgePoint, DraftQuestion,
  ContentVersion, ContentStatus, ModuleSummary
} from './types';

import type { ApiClient } from './client';
import { LocalClient } from './localClient';

function createApiClient(): ApiClient {
  const mode = import.meta.env.VITE_API_MODE;
  if (mode === 'remote') {
    // Dynamic import to avoid bundling remoteClient when not needed
    // In production, this would be a proper import
    console.warn('Remote API mode requested but falling back to local client. Set up Spring Boot backend first.');
  }
  return new LocalClient();
}

export const apiClient: ApiClient = createApiClient();
