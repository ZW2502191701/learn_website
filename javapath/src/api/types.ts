// ── API Types ───────────────────────────────────────────────────────
// These types define the contract between the frontend and the future
// Spring Boot backend. The localClient implements them against localStorage;
// the remoteClient will call REST endpoints matching these shapes.
//
// Future Spring Boot controllers (for reference):
//   @RestController @RequestMapping("/api/v1")
//   class UserStateController { GET/PUT /state }
//   class KnowledgeController { GET /modules, GET /modules/{id}/chapters, ... }
//   class InterviewController { POST /sessions, POST /sessions/{id}/answer, ... }
//   class ReviewController { GET /review/due, POST /review/score }
//   class SearchController { GET /search?q=... }
//   class AnalyticsController { GET /analytics/dashboard, GET /analytics/trends }

import type {
  AppData,
  UserState,
  InterviewMode,
  InterviewSession,
  InterviewReport,
  KnowledgePoint,
  Module,
  Chapter,
  InterviewQuestion,
  Scenario,
  StudyPlan,
  ReviewScheduleItem,
  MasteryRecord
} from '../types';
import type { SearchResult } from '../lib/search';

// ── Generic API wrapper ─────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ── Content API types ───────────────────────────────────────────────

export interface ModuleSummary {
  id: string;
  title: string;
  description: string;
  importance: number;
  knowledgePointCount: number;
  questionCount: number;
}

export interface ContentVersion {
  version: number;
  publishedAt: string;
  moduleCount: number;
  knowledgePointCount: number;
  questionCount: number;
}

export interface ContentStatus {
  draft: number;
  review: number;
  published: number;
}

// ── Interview API types ─────────────────────────────────────────────

export interface StartSessionRequest {
  mode: InterviewMode;
  moduleId?: string;
  questionCount?: number;
}

export interface StartSessionResponse {
  session: InterviewSession;
  questions: InterviewQuestion[];
}

export interface SubmitAnswerRequest {
  questionId: string;
  userAnswer: string;
  duration: number;
  selfScore: number;
}

export interface SubmitAnswerResponse {
  session: InterviewSession;
  feedback: {
    score: number;
    keyPointsCovered: string[];
    keyPointsMissed: string[];
    suggestion: string;
  };
}

export interface CompleteSessionResponse {
  session: InterviewSession;
  report: InterviewReport;
}

// ── Review API types ────────────────────────────────────────────────

export interface ReviewScoreRequest {
  questionId: string;
  quality: number; // 0-5
}

export interface ReviewScoreResponse {
  item: ReviewScheduleItem;
  nextReviewAt: string;
}

export interface DueReviewItem {
  questionId: string;
  questionTitle: string;
  moduleId: string;
  moduleTitle: string;
  easeFactor: number;
  intervalDays: number;
  daysOverdue: number;
}

// ── Search API types ────────────────────────────────────────────────

export interface SearchRequest {
  query: string;
  types?: string[];
  moduleId?: string;
  difficulty?: number;
  limit?: number;
  offset?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
}

// ── Analytics API types ─────────────────────────────────────────────

export interface DashboardSummary {
  overallMastery: number;
  interviewReadiness: number;
  daysUntilTarget: number;
  dueReviewCount: number;
  wrongQuestionCount: number;
  streak: number;
  todayTasks: {
    studies: string[];
    reviews: string[];
    interviewModes: string[];
  };
}

export interface TrendDataPoint {
  date: string;
  studied: number;
  reviewed: number;
  correctRate: number;
}

export interface ModuleAnalytics {
  moduleId: string;
  title: string;
  mastery: number;
  correctRate: number;
  questionCount: number;
  wrongCount: number;
}

// ── PDF Pipeline types ──────────────────────────────────────────────

export type ContentPublishStatus = 'draft' | 'review' | 'published';

export interface ParsedPdfMetadata {
  filename: string;
  title: string;
  module: string;
  pageCount: number;
  parsedAt: string;
  wordCount: number;
}

export interface DraftKnowledgePoint {
  id: string;
  title: string;
  content: string;
  sourcePdf: string;
  pageNumber: number;
  confidence: number;
  needsReview: boolean;
  status: ContentPublishStatus;
}

export interface DraftQuestion {
  id: string;
  title: string;
  answer: string;
  sourcePdf: string;
  pageNumber: number;
  confidence: number;
  needsReview: boolean;
  status: ContentPublishStatus;
}
