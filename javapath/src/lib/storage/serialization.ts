import type { Favorite, PersistedUserState, ProgressStatus, StudyProgress, UserState, WrongQuestion } from '../../types';

export const STORAGE_VERSION = 1;
export const STATE_KEY = 'javapath.advanced.state.v1';
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
  theme: 'dark'
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

export const normalizeUserState = (raw: unknown, defaults = makeDefaultState()): UserState => {
  if (!isRecord(raw)) return defaults;
  return {
    progress: normalizeProgress(raw.progress),
    favorites: normalizeFavorites(raw.favorites),
    wrongQuestions: normalizeWrongQuestions(raw.wrongQuestions),
    notes: normalizeNotes(raw.notes),
    checkins: normalizeCheckins(raw.checkins, defaults),
    targetDate: isIsoDate(raw.targetDate) ? raw.targetDate : defaults.targetDate,
    theme: raw.theme === 'light' || raw.theme === 'dark' ? raw.theme : defaults.theme
  };
};

const unwrapPersistedPayload = (payload: unknown): unknown => {
  if (!isRecord(payload)) return null;
  if (payload.version === STORAGE_VERSION && isRecord(payload.state)) return payload.state;
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
  if (isRecord(parsed) && 'version' in parsed) {
    if (parsed.version !== STORAGE_VERSION) throw new Error(`不支持的学习状态版本：${String(parsed.version)}`);
    return normalizeUserState(parsed.state);
  }
  return normalizeUserState(parsed);
};
