export type ProgressStatus = 'not-started' | 'learning' | 'mastered' | 'review';

export type QuestionCategory =
  | '基础题'
  | '源码题'
  | '场景题'
  | '八股题'
  | '项目题'
  | '系统设计题'
  | 'HR面';

export interface Module {
  id: string;
  title: string;
  source: string;
  area: string;
  description: string;
  importance: number;
  estimatedHours: number;
  tags: string[];
  chapterIds: string[];
}

export interface Chapter {
  id: string;
  moduleId: string;
  title: string;
  group: string;
  order: number;
  knowledgePointIds: string[];
}

export interface KnowledgePoint {
  id: string;
  moduleId: string;
  chapterId: string;
  title: string;
  group: string;
  tags: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  estimatedMinutes: number;
  coreConcepts: Array<{ title: string; body: string }>;
  pitfalls: string[];
  code?: string;
  dependencies: string[];
  relatedQuestionIds: string[];
}

export interface InterviewQuestion {
  id: string;
  moduleId: string;
  knowledgePointId?: string;
  category: QuestionCategory;
  title: string;
  answer: string;
  points: string[];
  followUps: string[];
  traps: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  frequency: number;
}

export interface Scenario {
  id: string;
  title: string;
  moduleIds: string[];
  tags: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  background: string;
  problem: string;
  analysisPath: string[];
  solution: string[];
  architecture: Array<{ from: string; to: string; label: string }>;
  expressionTemplate: string;
  relatedQuestionIds: string[];
}

export interface StudyProgress {
  knowledgePointId: string;
  status: ProgressStatus;
  correct: number;
  attempts: number;
  lastStudiedAt?: string;
  note?: string;
}

export interface WrongQuestion {
  questionId: string;
  moduleId: string;
  reason: string;
  note: string;
  createdAt: string;
}

export interface Favorite {
  targetId: string;
  targetType: 'knowledge' | 'question' | 'scenario';
  createdAt: string;
}

export interface StudyPlan {
  id: string;
  days: 7 | 14 | 30 | 60;
  title: string;
  focus: string[];
  dailyTasks: Array<{
    day: number;
    title: string;
    moduleIds: string[];
    minutes: number;
    taskIds: string[];
  }>;
}

export interface AppData {
  modules: Module[];
  chapters: Chapter[];
  knowledgePoints: KnowledgePoint[];
  questions: InterviewQuestion[];
  scenarios: Scenario[];
  studyPlans: StudyPlan[];
}

export interface UserState {
  progress: Record<string, StudyProgress>;
  favorites: Favorite[];
  wrongQuestions: WrongQuestion[];
  notes: Record<string, string>;
  checkins: string[];
  targetDate: string;
  theme: 'light' | 'dark';
}

export interface PersistedUserState {
  version: 1;
  exportedAt?: string;
  state: UserState;
}

export type RouteId =
  | 'dashboard'
  | 'path'
  | 'modules'
  | 'graph'
  | 'interview'
  | 'scenarios'
  | 'plan'
  | 'review'
  | 'search';

export interface RouteProps {
  state: UserState;
  setState: React.Dispatch<React.SetStateAction<UserState>>;
  goTo: (route: RouteId, query?: string) => void;
  globalQuery: string;
}
