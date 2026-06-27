import type {
  Favorite,
  InterviewMode,
  InterviewSession,
  LearningSession,
  MasteryRecord,
  PersistedUserState,
  ProgressStatus,
  ProjectExpression,
  ReviewScheduleItem,
  StudyProgress,
  UserState,
  WrongQuestion
} from '../../types';

export const STORAGE_VERSION = 2;
export const STATE_KEY = 'javapath.advanced.state.v2';
export const STATE_BACKUP_KEY = `${STATE_KEY}.backup`;

const progressStatuses: ProgressStatus[] = ['not-started', 'learning', 'mastered', 'review'];
const favoriteTypes: Favorite['targetType'][] = ['knowledge', 'question', 'scenario'];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === 'string';

const isIsoDate = (value: unknown): value is string =>
  isString(value) && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00`).getTime());

const isIsoDateTime = (value: unknown): value is string => isString(value) && !Number.isNaN(Date.parse(value));

const isProgressStatus = (value: unknown): value is ProgressStatus =>
  isString(value) && progressStatuses.includes(value as ProgressStatus);

const isFavoriteType = (value: unknown): value is Favorite['targetType'] =>
  isString(value) && favoriteTypes.includes(value as Favorite['targetType']);

const numberOrZero = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0);

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
  theme: 'dark',
  reviewSchedule: [],
  interviewSessions: [],
  learningSessions: [],
  masteryHistory: [],
  projectExpressions: []
});

const safeParse = (raw: string): unknown | null => {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
};

const normalizeProgress = (value: unknown): Record<string, StudyProgress> => {
  if (!isRecord(value)) return {};
  return Object.entries(value).reduce<Record<string, StudyProgress>>((acc, [key, raw]) => {
    if (!isRecord(raw)) return acc;
    const knowledgePointId = isString(raw.knowledgePointId) && raw.knowledgePointId.trim() ? raw.knowledgePointId : key;
    if (!knowledgePointId) return acc;
    acc[knowledgePointId] = {
      knowledgePointId,
      status: isProgressStatus(raw.status) ? raw.status : 'not-started',
      correct: numberOrZero(raw.correct),
      attempts: numberOrZero(raw.attempts),
      ...(isIsoDateTime(raw.lastStudiedAt) ? { lastStudiedAt: raw.lastStudiedAt } : {}),
      ...(isString(raw.note) ? { note: raw.note } : {})
    };
    return acc;
  }, {});
};

const normalizeFavorites = (value: unknown): Favorite[] => {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.reduce<Favorite[]>((acc, raw) => {
    if (!isRecord(raw) || !isString(raw.targetId) || !isFavoriteType(raw.targetType)) return acc;
    const key = `${raw.targetType}:${raw.targetId}`;
    if (seen.has(key)) return acc;
    seen.add(key);
    acc.push({
      targetId: raw.targetId,
      targetType: raw.targetType,
      createdAt: isIsoDateTime(raw.createdAt) ? raw.createdAt : new Date().toISOString()
    });
    return acc;
  }, []);
};

const normalizeWrongQuestions = (value: unknown): WrongQuestion[] => {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.reduce<WrongQuestion[]>((acc, raw) => {
    if (!isRecord(raw) || !isString(raw.questionId) || !isString(raw.moduleId)) return acc;
    if (seen.has(raw.questionId)) return acc;
    seen.add(raw.questionId);
    acc.push({
      questionId: raw.questionId,
      moduleId: raw.moduleId,
      reason: isString(raw.reason) && raw.reason.trim() ? raw.reason : '答题要点缺失',
      note: isString(raw.note) ? raw.note : '',
      createdAt: isIsoDateTime(raw.createdAt) ? raw.createdAt : new Date().toISOString()
    });
    return acc;
  }, []);
};

const normalizeNotes = (value: unknown): Record<string, string> => {
  if (!isRecord(value)) return {};
  return Object.entries(value).reduce<Record<string, string>>((acc, [key, note]) => {
    if (isString(note)) acc[key] = note;
    return acc;
  }, {});
};

const normalizeCheckins = (value: unknown, defaults: UserState): string[] => {
  if (!Array.isArray(value)) return defaults.checkins;
  const seen = new Set<string>();
  return value.filter(isIsoDate).filter((item) => {
    if (seen.has(item)) return false;
    seen.add(item);
    return true;
  }).sort();
};

const interviewModes: InterviewMode[] = [
  'first-round', 'second-round', 'hr', 'big-tech-pressure', 'quick-drill', 'error-review', 'weak-spot'
];
const isInterviewMode = (v: unknown): v is InterviewMode =>
  isString(v) && interviewModes.includes(v as InterviewMode);

const normalizeReviewSchedule = (value: unknown): ReviewScheduleItem[] => {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.reduce<ReviewScheduleItem[]>((acc, raw) => {
    if (!isRecord(raw) || !isString(raw.questionId)) return acc;
    if (seen.has(raw.questionId)) return acc;
    seen.add(raw.questionId);
    acc.push({
      questionId: raw.questionId,
      knowledgePointId: isString(raw.knowledgePointId) ? raw.knowledgePointId : '',
      moduleId: isString(raw.moduleId) ? raw.moduleId : '',
      easeFactor: typeof raw.easeFactor === 'number' && raw.easeFactor >= 1.3 ? raw.easeFactor : 2.5,
      intervalDays: typeof raw.intervalDays === 'number' && raw.intervalDays > 0 ? raw.intervalDays : 1,
      repetitions: typeof raw.repetitions === 'number' && raw.repetitions >= 0 ? raw.repetitions : 0,
      nextReviewAt: isIsoDateTime(raw.nextReviewAt) ? raw.nextReviewAt : new Date().toISOString(),
      lastQuality: typeof raw.lastQuality === 'number' ? raw.lastQuality : 0,
      createdAt: isIsoDateTime(raw.createdAt) ? raw.createdAt : new Date().toISOString()
    });
    return acc;
  }, []);
};

const normalizeInterviewSessions = (value: unknown): InterviewSession[] => {
  if (!Array.isArray(value)) return [];
  return value.reduce<InterviewSession[]>((acc, raw) => {
    if (!isRecord(raw) || !isString(raw.id) || !isInterviewMode(raw.mode)) return acc;
    acc.push({
      id: raw.id,
      mode: raw.mode,
      startedAt: isIsoDateTime(raw.startedAt) ? raw.startedAt : new Date().toISOString(),
      endedAt: isIsoDateTime(raw.endedAt) ? raw.endedAt : undefined,
      questionIds: Array.isArray(raw.questionIds) ? raw.questionIds.filter(isString) : [],
      answers: Array.isArray(raw.answers)
        ? (raw.answers as unknown[]).filter((a): a is Record<string, unknown> => isRecord(a) && isString(a.questionId)).map((a) => ({
            questionId: a.questionId as string,
            userAnswer: isString(a.userAnswer) ? a.userAnswer : '',
            duration: typeof a.duration === 'number' ? a.duration : 0,
            selfScore: typeof a.selfScore === 'number' ? a.selfScore : 0
          }))
        : [],
      overallScore: typeof raw.overallScore === 'number' ? raw.overallScore : undefined,
      dimensionScores: isRecord(raw.dimensionScores)
        ? Object.fromEntries(
            Object.entries(raw.dimensionScores as Record<string, unknown>)
              .filter((pair): pair is [string, number] => typeof pair[1] === 'number')
          ) as Record<string, number>
        : undefined,
      summary: isString(raw.summary) ? raw.summary : undefined
    });
    return acc;
  }, []);
};

const normalizeLearningSessions = (value: unknown): LearningSession[] => {
  if (!Array.isArray(value)) return [];
  return value.reduce<LearningSession[]>((acc, raw) => {
    if (!isRecord(raw) || !isString(raw.id)) return acc;
    acc.push({
      id: raw.id,
      startedAt: isIsoDateTime(raw.startedAt) ? raw.startedAt : new Date().toISOString(),
      endedAt: isIsoDateTime(raw.endedAt) ? raw.endedAt : new Date().toISOString(),
      durationSeconds: typeof raw.durationSeconds === 'number' ? raw.durationSeconds : 0,
      knowledgePointsStudied: Array.isArray(raw.knowledgePointsStudied) ? raw.knowledgePointsStudied.filter(isString) : [],
      questionsAttempted: Array.isArray(raw.questionsAttempted) ? raw.questionsAttempted.filter(isString) : [],
      correctCount: typeof raw.correctCount === 'number' ? raw.correctCount : 0,
      totalCount: typeof raw.totalCount === 'number' ? raw.totalCount : 0,
      mode: ['study', 'review', 'interview', 'practice'].includes(raw.mode as string) ? raw.mode as LearningSession['mode'] : 'study'
    });
    return acc;
  }, []);
};

const normalizeMasteryHistory = (value: unknown): MasteryRecord[] => {
  if (!Array.isArray(value)) return [];
  return value.reduce<MasteryRecord[]>((acc, raw) => {
    if (!isRecord(raw) || !isString(raw.knowledgePointId)) return acc;
    const level = ['unknown', 'beginner', 'familiar', 'mastered', 'expert'].includes(raw.level as string)
      ? raw.level as MasteryRecord['level']
      : 'unknown';
    acc.push({
      knowledgePointId: raw.knowledgePointId,
      score: typeof raw.score === 'number' ? raw.score : 0,
      level,
      forgetRisk: typeof raw.forgetRisk === 'number' ? raw.forgetRisk : 0,
      lastReviewedAt: isIsoDateTime(raw.lastReviewedAt) ? raw.lastReviewedAt : undefined,
      recordedAt: isIsoDateTime(raw.recordedAt) ? raw.recordedAt : new Date().toISOString()
    });
    return acc;
  }, []);
};

const normalizeProjectExpressions = (value: unknown): ProjectExpression[] => {
  if (!Array.isArray(value)) return [];
  return value.reduce<ProjectExpression[]>((acc, raw) => {
    if (!isRecord(raw) || !isString(raw.id) || !isString(raw.moduleId)) return acc;
    acc.push({
      id: raw.id,
      moduleId: raw.moduleId,
      title: isString(raw.title) ? raw.title : '',
      businessBackground: isString(raw.businessBackground) ? raw.businessBackground : '',
      technicalProblem: isString(raw.technicalProblem) ? raw.technicalProblem : '',
      whyThisTech: isString(raw.whyThisTech) ? raw.whyThisTech : '',
      howToDesign: isString(raw.howToDesign) ? raw.howToDesign : '',
      coreCode: isString(raw.coreCode) ? raw.coreCode : '',
      issuesFaced: Array.isArray(raw.issuesFaced) ? raw.issuesFaced.filter(isString) : [],
      optimizations: Array.isArray(raw.optimizations) ? raw.optimizations.filter(isString) : [],
      followUps: Array.isArray(raw.followUps) ? raw.followUps.filter(isString) : [],
      scoreTemplate: isRecord(raw.scoreTemplate)
        ? Object.fromEntries(
            Object.entries(raw.scoreTemplate as Record<string, unknown>)
              .filter((pair): pair is [string, number] => typeof pair[1] === 'number')
          )
        : {}
    });
    return acc;
  }, []);
};

export const normalizeUserState = (raw: unknown, defaults = makeDefaultState()): UserState => {
  if (!isRecord(raw)) return defaults;
  return {
    progress: normalizeProgress(raw.progress),
    favorites: normalizeFavorites(raw.favorites),
    wrongQuestions: normalizeWrongQuestions(raw.wrongQuestions),
    notes: normalizeNotes(raw.notes),
    checkins: normalizeCheckins(raw.checkins, defaults),
    targetDate: isIsoDate(raw.targetDate) ? raw.targetDate : defaults.targetDate,
    theme: raw.theme === 'light' || raw.theme === 'dark' ? raw.theme : defaults.theme,
    reviewSchedule: normalizeReviewSchedule(raw.reviewSchedule),
    interviewSessions: normalizeInterviewSessions(raw.interviewSessions),
    learningSessions: normalizeLearningSessions(raw.learningSessions),
    masteryHistory: normalizeMasteryHistory(raw.masteryHistory),
    projectExpressions: normalizeProjectExpressions(raw.projectExpressions)
  };
};

const unwrapPersistedPayload = (payload: unknown): unknown => {
  if (!isRecord(payload)) return null;
  if (isRecord(payload.state)) {
    // Migrate v1 -> v2: pad new fields
    if (payload.version === 1) {
      const state = payload.state as Record<string, unknown>;
      state.reviewSchedule = state.reviewSchedule ?? [];
      state.interviewSessions = state.interviewSessions ?? [];
      state.learningSessions = state.learningSessions ?? [];
      state.masteryHistory = state.masteryHistory ?? [];
      state.projectExpressions = state.projectExpressions ?? [];
      payload.version = 2;
    }
    return payload.state;
  }
  return payload;
};

export const parsePersistedState = (serialized: string, defaults = makeDefaultState()): UserState => {
  const parsed = safeParse(serialized);
  return normalizeUserState(unwrapPersistedPayload(parsed), defaults);
};

export const serializeState = (state: UserState, exportedAt?: string) =>
  JSON.stringify(
    {
      version: STORAGE_VERSION,
      ...(exportedAt ? { exportedAt } : {}),
      state: normalizeUserState(state)
    } satisfies PersistedUserState,
    null,
    2
  );

export const exportState = (state: UserState) => serializeState(state, new Date().toISOString());

export const importState = (serialized: string): UserState => {
  const parsed = safeParse(serialized);
  if (!parsed) throw new Error('无法解析学习状态文件。');
  return normalizeUserState(unwrapPersistedPayload(parsed));
};
