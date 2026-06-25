import type { Favorite, ProgressStatus, StudyProgress, UserState, WrongQuestion } from '../types';

const STATE_KEY = 'javapath.advanced.state.v1';

const dateKey = (offset = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

const defaultTargetDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 45);
  return date.toISOString().slice(0, 10);
};

export const makeDefaultState = (): UserState => ({
  progress: {},
  favorites: [],
  wrongQuestions: [],
  notes: {},
  checkins: [dateKey(-6), dateKey(-5), dateKey(-3), dateKey(-2), dateKey(0)],
  targetDate: defaultTargetDate(),
  theme: 'dark'
});

export const loadState = (): UserState => {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return makeDefaultState();
    return { ...makeDefaultState(), ...JSON.parse(raw) } as UserState;
  } catch {
    return makeDefaultState();
  }
};

export const saveState = (state: UserState) => {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
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
