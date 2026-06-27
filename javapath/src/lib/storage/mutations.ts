import type {
  Favorite,
  InterviewSession,
  LearningSession,
  MasteryRecord,
  ProgressStatus,
  ProjectExpression,
  ReviewScheduleItem,
  StudyProgress,
  UserState,
  WrongQuestion
} from '../../types';

const dateKey = (offset = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

export const upsertProgress = (
  state: UserState,
  knowledgePointId: string,
  status: ProgressStatus
): UserState => {
  const current = state.progress[knowledgePointId];
  return {
    ...state,
    progress: {
      ...state.progress,
      [knowledgePointId]: {
        knowledgePointId,
        status,
        correct: current?.correct ?? 0,
        attempts: current?.attempts ?? 0,
        note: current?.note,
        lastStudiedAt: new Date().toISOString()
      } satisfies StudyProgress
    }
  };
};

export const toggleFavorite = (
  state: UserState,
  targetId: string,
  targetType: Favorite['targetType']
): UserState => {
  const exists = state.favorites.some((item) => item.targetId === targetId && item.targetType === targetType);
  return {
    ...state,
    favorites: exists
      ? state.favorites.filter((item) => !(item.targetId === targetId && item.targetType === targetType))
      : [...state.favorites, { targetId, targetType, createdAt: new Date().toISOString() }]
  };
};

export const toggleWrongQuestion = (
  state: UserState,
  questionId: string,
  moduleId: string,
  reason = '答题要点缺失'
): UserState => {
  const exists = state.wrongQuestions.some((item) => item.questionId === questionId);
  return {
    ...state,
    wrongQuestions: exists
      ? state.wrongQuestions.filter((item) => item.questionId !== questionId)
      : [
          ...state.wrongQuestions,
          {
            questionId,
            moduleId,
            reason,
            note: '',
            createdAt: new Date().toISOString()
          } satisfies WrongQuestion
        ]
  };
};

export const updateNote = (state: UserState, targetId: string, note: string): UserState => ({
  ...state,
  notes: {
    ...state.notes,
    [targetId]: note
  }
});

export const toggleTodayCheckin = (state: UserState): UserState => {
  const today = dateKey();
  return {
    ...state,
    checkins: state.checkins.includes(today)
      ? state.checkins.filter((item) => item !== today)
      : [...state.checkins, today]
  };
};

export const updateWrongNote = (state: UserState, questionId: string, note: string): UserState => ({
  ...state,
  wrongQuestions: state.wrongQuestions.map((item) => (item.questionId === questionId ? { ...item, note } : item))
});

export const addReviewScheduleItem = (state: UserState, item: ReviewScheduleItem): UserState => ({
  ...state,
  reviewSchedule: [...state.reviewSchedule.filter((r) => r.questionId !== item.questionId), item]
});

export const updateReviewScheduleItem = (
  state: UserState,
  questionId: string,
  updates: Partial<ReviewScheduleItem>
): UserState => ({
  ...state,
  reviewSchedule: state.reviewSchedule.map((r) =>
    r.questionId === questionId ? { ...r, ...updates } : r
  )
});

export const removeReviewScheduleItem = (state: UserState, questionId: string): UserState => ({
  ...state,
  reviewSchedule: state.reviewSchedule.filter((r) => r.questionId !== questionId)
});

export const addInterviewSession = (state: UserState, session: InterviewSession): UserState => ({
  ...state,
  interviewSessions: [...state.interviewSessions, session]
});

export const updateInterviewSession = (
  state: UserState,
  sessionId: string,
  updates: Partial<InterviewSession>
): UserState => ({
  ...state,
  interviewSessions: state.interviewSessions.map((s) =>
    s.id === sessionId ? { ...s, ...updates } : s
  )
});

export const addLearningSession = (state: UserState, session: LearningSession): UserState => ({
  ...state,
  learningSessions: [...state.learningSessions, session]
});

export const addMasteryRecord = (state: UserState, record: MasteryRecord): UserState => ({
  ...state,
  masteryHistory: [...state.masteryHistory, record]
});

export const upsertProjectExpression = (state: UserState, expression: ProjectExpression): UserState => ({
  ...state,
  projectExpressions: [
    ...state.projectExpressions.filter((e) => e.id !== expression.id),
    expression
  ]
});
